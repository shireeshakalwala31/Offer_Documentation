const mongoose=require("mongoose");
const pfSchema=new mongoose.Schema({
    draftId:{type:String,required:true},
    pfAction:String,
    uanNumber:String,
    existingPfNumber:String,
    bankAccountNumber:String,
    bankName: String,
    ifscCode: String,
    passportNumber: String,
  passportValidity: String,
  placeOfIssue: String,
  languages: [String],
  motherTongue: String,
  idMark1: String,
  idMark2: String,
  mobileNumber: String,
  email: {type:String,lowercase:true,unique:true}
}, { timestamps: true });
module.exports=mongoose.model("TempPF",pfSchema)