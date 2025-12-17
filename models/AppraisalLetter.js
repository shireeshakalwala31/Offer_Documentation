const mongoose=require("mongoose");
const AppraisalLetterSchema=new mongoose.Schema({
    employeeName:{type:String,required:true},
    employeeId:{type:String,required:true},
    dateOfJoining:{type:Date,required:true},
    newSalary:{type:Number,required:true},
    salaryInWords:{type:String,required:true},
    promotedRole:{type:String,required:true},
    issueDate:{type:Date,required:true},
    createdAt: { type: Date, default: Date.now }
})
module.exports= mongoose.model("Appraisal", AppraisalLetterSchema);
