Installation

1. Clone the Repository:

   git clone https://github.com/vinaysolaskar/Messaging-Website.git
   cd Messaging-Website

2. Install Backend Dependencies:

    cd server
    npm install

3. Install Frontend Dependencies:

    cd ../client
    cd my-app
    npm install

4. Create a .env file in the server:

    MONGODB_URI=your_mongodb_connection_string
    PORT=3000

5. Start the Backend:

    cd server
    node server.js

6. Start the Frontend:

    cd ../client
    cd my-app
    npm start

