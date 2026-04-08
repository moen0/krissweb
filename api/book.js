export default async function handler(req, res) {
    const query = `{
    me {
      user_books(where: {status_id: {_eq: 2}}) {
        book {
          title
          image { url }
          contributions {
            author { name }
          }
        }
      }
    }
  }`;

    const response = await fetch('https://api.hardcover.app/v1/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.HARDCOVER_API_TOKEN
        },
        body: JSON.stringify({ query })
    });

    const data = await response.json();
    const books = data.data.me[0].user_books;

    if (books.length === 0) {
        return res.json({ title: null, author: null, cover: null });
    }

    const book = books[0].book;
    const author = book.contributions[0]?.author?.name || 'Unknown';

    res.json({
        title: book.title,
        author: author,
        cover: book.image?.url || null
    });
}