const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/bookwise', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const bookSchema = new mongoose.Schema({
    title: String,
    author: String,
    review: String,
    rating: Number,
    imageUrl: String
});
const Book = mongoose.model('Book', bookSchema);

async function clearReviews() {
    const result = await Book.deleteMany({});
    console.log(`Deleted ${result.deletedCount} reviews`);
    mongoose.connection.close();
}

clearReviews();
