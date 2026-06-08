import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  o: [{ type: String }]
});
const Model = mongoose.model('Test', schema);
try {
  const doc = new Model({ o: [ [ '¹H', '²H' ], [ '¹⁴C', '¹⁴N' ] ] });
  await doc.validate();
  console.log("Success Array");
} catch (e) { console.log("Array Error:", e.message); }

try {
  const doc = new Model({ o: [ {a:1} ] });
  await doc.validate();
  console.log("Success Object");
} catch (e) { console.log("Object Error:", e.message); }

