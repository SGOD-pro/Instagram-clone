const mongoose=require("mongoose")

const userSchema=mongoose.Schema({
    post:String,
    likes:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    }],
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    caption:String,
    date:{
        type: Date,
        default:Date.now
    }
})

module.exports=mongoose.model('post',userSchema)