import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  o: [{ type: String }]
});
const Model = mongoose.model('Test', schema);
try {
  const arr = [
    [ '¹H', '²H' ],
    [ '¹⁴C', '¹⁴N' ],
    [ '²³Na', '²⁴Mg' ],
    [ '⁴⁰Ar', '⁴⁰Ca' ]
  ];
  const doc = new Model({ o: [ arr ] });
  await doc.validate();
} catch (e) { console.log(e.message); }

