import { Inngest } from "inngest";
import User from "../models/user.js";
import Booking from "../models/Booking.js";
import Show from "../models/show.js";
import sendEmail from "../config/nodeMailer.js";


// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

//inngest fn to dsave userdata in db
const syncUserCreation = inngest.createFunction(
  { id: "sync_user_from_clerk" },
  { event: 'clerk/user.created' },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    const userData = {
      _id: id,
      email: email_addresses[0].email_address,          // full email
      name: `${first_name} ${last_name}`,
      image: image_url,
    };
    await User.create(userData);
  }
);

//inngest fn to delete user from db
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;
    await User.findByIdAndDelete(id);
  }
);

//inngest fn to update user in mongodb db
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + " " + last_name,
      image: image_url,
    };
    await User.findByIdAndUpdate(id, userData);
  }
);


//inngest fn to cancel booking and release seat after 10 mint of booking if payment isnt made

const ReleaseSeatsAndDeleteBooking = inngest.createFunction(
  { id: 'release-seat-delete-booking'},

  { event: "app/checkpayment" },
  async({ event, step })=>{
    const tenMinuteslater = new Date(Date.now()+10*60*1000);
    await step.sleepUntil('wait-for-10-minutes', tenMinuteslater);

    await step.run('check-payment-status', async()=>{
      const bookingId = event.data.bookingId;
      // amazonq-ignore-next-line
      const booking = await Booking.findById(bookingId);

      //if payment not made thn deleting booking and releasing the seat

      if(!booking.isPaid){
        const show = await Show.findById(booking.show);
        booking.bookedSeats.forEach((seat)=>{
          delete show.occupiedSeat[seat]
        })
        show.markModified('occupiedSeat')
        await show.save()
        await Booking.findByIdAndDelete(booking._id)
      }
    })
  })

const sendBookingConfirmationMail = inngest.createFunction(
  { id: 'send-booking-confirmation-mail' },
  { event: 'app/show.booked' },
  async ({ event, step }) => {
    const { bookingId } = event.data;
    const booking = await Booking.findById(bookingId)
      .populate({
        path: 'show',
        populate: {
          path: 'movie',
          model: 'Movie'
        }
      }).populate('user');

      await sendEmail({
        to: booking.user.email,
        subject: `Booking Confirmation for ${booking.show.movie.title}`,
        body:  `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#1f2937;color:#fff;padding:20px;text-align:center"><h1>🎬 Booking Confirmed!</h1></div><div style="padding:30px"><h2>Hi ${booking.user.name},</h2><p>Your movie ticket booking has been confirmed:</p><div style="background:#f8f9fa;padding:20px;border-radius:6px;margin:20px 0"><h3>${booking.show.movie.title}</h3><p><strong>Date:</strong> ${new Date(booking.show.showDatetime).toLocaleDateString()}</p><p><strong>Time:</strong> ${new Date(booking.show.showDatetime).toLocaleTimeString()}</p></div><div style="border-left:4px solid #3b82f6;padding-left:15px;margin:20px 0"><p><strong>Booking ID:</strong> ${booking._id}</p><p><strong>Amount:</strong> $${booking.amount}</p><p><strong>Seats:</strong> ${booking.bookedSeats.join(', ')}</p></div><p>Enjoy your movie!</p></div></div>`

      })
    
    if (booking && booking.user) {
      console.log(`Booking confirmation for ${booking.user.email}`);
    }
  }
);




// Create an empty array where we'll export future Inngest functions

export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation, ReleaseSeatsAndDeleteBooking, sendBookingConfirmationMail];

