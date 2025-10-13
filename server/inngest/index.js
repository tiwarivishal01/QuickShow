import { Inngest } from "inngest";
import User from "../models/user.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booki" });

//inngest fn to dsave userdata in db
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_address, image_url } = event.data;
    const userData = {
      _id: id,
      email: email_address[0],
      name: first_name + " " + last_name,
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
const updateUserData = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_address, image_url } = event.data;
    const userData = {
      _id: id,
      email: email_address[0],
      name: first_name + " " + last_name,
      image: image_url,
    };
    await User.findByIdAndUpdate(id, userData);
  }
);

// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation, syncUserDeletion, updateUserData];
