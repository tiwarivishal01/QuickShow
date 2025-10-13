import mongoose from "mongoose";

const connectdb = async ()=>{
    try{
        mongoose.connection.on('connected', ()=>{
            console.log("database connected");
        })
        await mongoose.connect(`${process.env.MONGODB_URI}/quickshow`)

    }catch(error){
        console.log(error.message);
        

    }
}
export default connectdb;