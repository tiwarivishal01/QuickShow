import { Inngest } from "inngest";
import User from "../models/user.js";
import Booking from "../models/Booking.js";
import Show from "../models/show.js";

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
    console.log(userData)
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

// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation, ReleaseSeatsAndDeleteBooking];
