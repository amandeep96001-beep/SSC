import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  o: [{ type: String }]
});
const Model = mongoose.model('Test', schema);
try {
  // Pass an array as the value of `o` but the array contains something that can't be cast?
  // No, what if we pass a String to o that cannot be cast to an Array of Strings?
  const doc = new Model({ o: "just a string" });
  await doc.validate();
  console.log("Success String");
} catch (e) { console.log("String Error:", e.message); }

