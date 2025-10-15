import mongoose from "mongoose";

const connectdb = async () => {
    try {
        mongoose.connection.on('connected', () => {
            console.log("database connected");
        })
      const conn =  await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    } catch (error) {
        console.log(error.message);


    }
}
export default connectdb;