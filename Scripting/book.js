fetch('/api/book')
    .then(function(r) { return r.json(); })
    .then(function(book) {
        if (!book.title) return;
        document.querySelector('.book img').src = book.cover;
        document.querySelector('.book img').alt = book.title + ' by ' + book.author;
        document.querySelector('.book-title').textContent = book.title;
        document.querySelector('.book-author').textContent = book.author;
    })
    .catch(function(err) {
        console.error('Failed to fetch book:', err);
    });