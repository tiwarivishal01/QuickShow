import mongoose from "mongoose";
const showSchema = new mongoose.Schema(
    {
        movie: { type: String, required: true, ref: 'Movie' },
        showDatetime: { type: Date, required: true },
        showPrice: { type: Number, required: true },
        occupiedSeat: { type: Object, default: {} },
    }, { minimize: false }
)   



const Show = mongoose.model("Show", showSchema);

export default Show;