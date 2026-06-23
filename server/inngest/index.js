import { Inngest } from "inngest";
import User from "../models/user.js";
import Booking from "../models/Booking.js";
import Show from "../models/show.js";
import Movie from "../models/Movie.js";
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
      email: email_addresses[0],
      name: first_name + " " + last_name,
      image: image_url,
    };
    await User.findByIdAndUpdate(id, userData);
  }
);

//inngest fn to cancel booking and release seat after 10 mint of booking if payment isnt made
const ReleaseSeatsAndDeleteBooking = inngest.createFunction(
    { id: 'release-seat-delete-booking' },
    { event: "app/checkpayment" },
    async ({ event, step }) => {
        const tenMinuteslater = new Date(Date.now() + 2 * 60 * 1000);  //making sleep for 2 mint as test
        await step.sleepUntil('wait-for-10-minutes', tenMinuteslater);

        await step.run('check-payment-status', async () => {
            const bookingId = event.data.bookingId;
            const booking = await Booking.findById(bookingId);

            //if payment not made thn deleting booking and releasing the seat
            if (!booking.isPaid) {
                const show = await Show.findById(booking.show);
                booking.bookedSeats.forEach((seat) => {
                    delete show.occupiedSeat[seat]
                })
                show.markModified('occupiedSeat')
                await show.save()
                await Booking.findByIdAndDelete(booking._id)
            }
        })
    })



const sendBookingConfirmationMail = inngest.createFunction(
    { id: "send-booking-confirmation-mail" },
    { event: 'app/show.booked' },
    async ({ event, step }) => {
        const { bookingId } = event.data;

        const booking = await step.run('fetch-booking-data', async () => {
            const bookingData = await Booking.findById(bookingId)
                .populate({
                    path: 'show',
                    populate: { path: 'movie', model: 'Movie' }
                })
                .populate('user');

            if (!bookingData) {
                return null;
            }

            // If user is not populated (string Clerk ID), fetch from DB; otherwise keep populated object
            if (!bookingData.user || typeof bookingData.user === 'string') {
                const userId = bookingData.user;
                if (userId) {
                    const userData = await User.findById(userId);
                    bookingData.user = userData || null;
                } else {
                    bookingData.user = null;
                }
            }

            return bookingData;
        });



        if (!booking) {
            console.error(`[Email] Booking not found for bookingId: ${bookingId}`);
            return { error: "Booking not found." };
        }

        if (!booking.user) {
            console.warn(`[Email] User not found in database for bookingId: ${bookingId}. Skipping email.`);
            return { success: false, message: "User not found - email skipped" };
        }

        if (!booking.show) {
            console.error(`[Email] Show data not found for bookingId: ${bookingId}`);
            return { error: "Show data not found." };
        }

        if (!booking.show.movie) {
            console.error(`[Email] Movie data not found for bookingId: ${bookingId}`);
            return { error: "Movie data not found." };
        }

        if (!booking.isPaid) {
            console.warn(`[Email] Booking ${bookingId} not paid yet; skipping email.`);
            return { error: "Booking not paid." };
        }

        if (!booking.user.email) {
            console.error(`[Email] User email not found for bookingId: ${bookingId}`);
            return { error: "User email not found." };
        }



        const movieTitle = booking.show.movie.title;
        const showDateTime = new Date(booking.show.showDatetime);
        const showDate = showDateTime.toLocaleDateString();
        const showTime = showDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const poster = booking.show.movie.poster_path;

        return await step.run('send-confirmation-email', async () => {
            const movieId = (booking.show.movie && (booking.show.movie._id || booking.show.movie.id || booking.show.movie)) || '';
            const rawPoster = booking.show.movie?.poster_path;
            const poster = rawPoster
                ? (rawPoster.startsWith('http') ? rawPoster : `https://image.tmdb.org/t/p/w500${rawPoster}`)
                : '';
            const seatCount = Array.isArray(booking.bookedSeats) ? booking.bookedSeats.length : 0;
            const totalAmount = booking.amount;

            await sendEmail({
                to: booking.user.email,
                subject: 'Your QuickShow Ticket',
                body: `
        <div style="max-width: 640px; margin: 0 auto; font-family: Arial, sans-serif; color: #1a1a1a;">
          <div style="background-color: #7b2cbf; color: white; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 20px;">🎟️ Your QuickShow Ticket is Confirmed</h1>
          </div>

          <div style="border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <div style="display: flex; flex-wrap: wrap;">
              <div style="flex: 1 1 240px; background:#f8f8fb; min-height: 220px; display:flex; align-items:center; justify-content:center;">
                ${poster ? `<img src="${poster}" alt="${movieTitle} Poster" style="width: 100%; max-height: 240px; object-fit: cover;" />` : `
                <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#7b2cbf;">
                  <div>
                    <div style="font-size: 14px;">Poster unavailable</div>
                    <div style="font-size: 18px; font-weight: bold;">${movieTitle}</div>
                  </div>
                </div>`}
              </div>

              <div style="flex: 2 1 320px; padding: 20px;">
                <h2 style="margin: 0 0 8px; font-size: 18px; color:#111;">${movieTitle}</h2>
                <div style="margin: 8px 0 16px; color:#555;">
                  <div><strong>Date:</strong> ${showDate}</div>
                  <div><strong>Time:</strong> ${showTime}</div>
                </div>

                <div style="margin: 8px 0;">
                  <div style="margin-bottom: 6px"><strong>Seats:</strong> ${booking.bookedSeats?.join(', ') || 'N/A'}</div>
                  <div style="color:#555"><strong>Tickets:</strong> ${seatCount} · <strong>Each:</strong> ${booking.show.showPrice} · <strong>Total:</strong> ${totalAmount}</div>
                </div>

                <div style="margin: 12px 0; color:#555">
                  <strong>Booking ID:</strong> <span style="color: #7b2cbf;">${booking.id}</span>
                </div>

                <div style="margin-top: 14px;">
                  ${movieId ? `<a href="https://quickshow-alpha-one.vercel.app/movies/${movieId}" style="background-color:#7b2cbf; color:white; padding: 10px 14px; text-decoration:none; border-radius:6px; font-weight:bold;">View Movie</a>` : ''}
                </div>
              </div>
            </div>

            <div style="border-top: 1px dashed #ddd; margin: 10px 16px;"></div>

            <div style="padding: 16px; text-align:center; color:#555; font-size:14px;">
              <div>🎬 Enjoy your show! Don’t forget popcorn.</div>
              <div style="margin-top:6px">Need help? Visit <a href="https://quickshow-alpha-one.vercel.app" style="color:#7b2cbf; text-decoration:none;">QuickShow</a></div>
            </div>
          </div>
        </div>`
            });
            return { success: true, message: `Confirmation email sent for booking ${bookingId}` };
        });
    }
);

const sendNewMovieEmail = inngest.createFunction(
    { id: 'send-new-movie-notification' },
    { event: 'app/movie.added' },
    async ({ event }) => {
        const { movieId } = event.data;
        const users = await User.find({});
        const movie = await Movie.findById(movieId);

        if (!movie) return "No movie found";

        for (const user of users) {
            const userEmail = user.email;
            const userName = user.name;

            const subject = `🎬 New Movie on QuickShow: ${movie.title}`;
            const posterPath = movie.poster_path ? (movie.poster_path.startsWith('http') ? movie.poster_path : `https://image.tmdb.org/t/p/w500${movie.poster_path}`) : '';
            const releaseYear = (movie.release_date || '').split('-')[0] || 'N/A';
            const genres = Array.isArray(movie.genres) ? movie.genres.map(g => g.name).join(', ') : 'N/A';
            const overview = movie.overview || '';

            const body = `<div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <div style="background-color: #7b2cbf; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Hi ${userName},</h1>
            </div>

            <div style="padding: 24px; color: #333;">
                <h2 style="margin-top: 0;">"${movie.title}" is Now Available on QuickShow!</h2>
                <p><strong>Release Year:</strong> ${releaseYear}</p>
                <p><strong>Genres:</strong> ${genres}</p>
                <p>${overview}</p>

                ${posterPath ? `<img src="${posterPath}" alt="${movie.title} Poster" style="width: 100%; max-height: 350px; object-fit: cover; border-radius: 4px; margin-top: 16px;" />` : ''}

                <div style="margin-top: 20px; text-align: center;">
                <a href="https://quickshow-alpha-one.vercel.app/movies/${movieId}" style="background-color: #7b2cbf; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">🎟️ Book Your Tickets</a>
                </div>
            </div>

            <div style="background-color: #f5f5f5; color: #777; padding: 16px; text-align: center; font-size: 14px;">
                <p style="margin: 0;">Thanks for staying with QuickShow!<br>We bring the cinema to your fingertips.</p>
                <p style="margin: 4px 0 0;">📍 Visit us: <a href="https://quickshow-alpha-one.vercel.app" style="color: #7b2cbf; text-decoration: none;">QuickShow</a></p>
            </div>
            </div>`

            await sendEmail({
                to: userEmail,
                subject,
                body,
            })
        }
        return { message: 'Notification sent' }
    }
)


export const functions = [syncUserCreation, syncUserUpdation, syncUserDeletion, ReleaseSeatsAndDeleteBooking,sendBookingConfirmationMail, sendNewMovieEmail];
