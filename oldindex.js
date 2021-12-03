const sqlite = require("sqlite3").verbose();
var Promise = require('promise')

//connection to database
let db = new sqlite.Database("./db/cursach.db", (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Successfull conected");
});

console.log(db);

//bot api
const TelegramAPI = require("node-telegram-bot-api");

//access token for bot
const token = "2128129298:AAFA1UzIeGP81RMeR4cuREdKBMtA09or330";

const bot = new TelegramAPI(token, { polling: true });

//list of commands
bot.setMyCommands([
  { command: "/start", description: "Greetings message" },
  { command: "/info", description: "User info" },
]);

const checkUserExist = async (nickname, chatID) => {
  return new Pormise((resolve) => {
    db.get(
      `SELECT Name FROM User WHERE Nickname=('${nickname}')`,
      [],
      async (err, rows) => {
        if (err) {
          return console.log(err);
        }
        resolve(rows);
      }
    );
  }).then(rows => response(rows));
};

const authButtons = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        { text: "coach", callback_data: 1 },
        { text: "fan", callback_data: 0 },
      ],
    ],
  }),
};

const getTeams = () => {
  db.all("SELECT Name, ID FROM Team", [], async (err, rows) => {
    if (!!rows) {
      bot.sendMessage(
        chatID,
        "Something new :/ Let`s add your team to our data\n Please use our template"
      );
      bot.sendMessage(
        chatID,
        "TEMPLATE:\nTeam_name, description, date_of_birth, city_id"
      );
      bot.on("message", async (msg) => {
        const teamData = msg.text.split(",");
        console.log(teamData);
      });
    }
  });
};

const start = async (msg) => {
  const chatID = msg.chat.id;
  const username = msg.from.username;
  const isUserExist = await checkUserExist(username, chatID);

  bot.sendSticker(
    chatID,
    "https://tlgrm.ru/_/stickers/35a/cc3/35acc3d9-6859-4b58-923e-bcb3d8779314/3.webp"
  );
  bot.sendMessage(
    chatID,
    `Greetings, ${msg.from.first_name} ${msg.from.last_name}. We glad to see you. \nIt is @karasu_tengo course work bot.`
  );
  await console.log(isUserExist);
  if (!isUserExist) {
    console.log("not exist");
    console.log("ssss");
    await bot.sendMessage(chatID, "So, are you fan or coach?", authButtons);
    await bot.on("callback_query", async (msg) => {
      const userInfo = msg.from;
      const isCoach = msg.data;
      // getTeams();
      const payload = [
        userInfo.id,
        userInfo.first_name,
        userInfo.last_name,
        userInfo.username,
        isCoach,
        false,
      ];
      const placeholders = payload
        .map((item, index, self) => {
          if (index === 0) {
            return "(?";
          } else if (index === self.length - 1) {
            return "?)";
          } else return "?";
        })
        .join(",");
      const sqlQuery =
        "INSERT INTO User(ID, Name, Surname, Nickname, isCoach, isAdmin) VALUES" +
        placeholders;
      db.run(sqlQuery, payload, async (err) => {
        if (err) {
          console.log(err);
        }
        console.log("SUCCESS");
      });
      await bot.sendMessage(
        chatID,
        "I really like new meetings) So, how can i help you?"
      );
    });
  }
  await bot.sendMessage(
    chatID,
    "What i should to do?\nPlease, print command or choose someone in menu\nIf you need some help print /help"
  );
};
//command hadler
const handleCommand = async (msg, cmd) => {
  const chatID = msg.chat.id;
  switch (cmd) {
    case "/start":
      await start(msg);
      break;

    case "/info":
      await bot.sendMessage(chatID, "In process");
      break;

    default:
      return bot.sendMessage(chatID, "I didn`t get you :(");
  }
};

//event listener for message
bot.on("message", async (msg) => {
  //user`s message text
  const text = msg.text;
  const chatID = msg.chat.id;
  //check if message is a command
  if (text[0] === "/") {
    bot.on("polling_error", (err) => console.log(err));
    const command = text.toLowerCase();
    return handleCommand(msg, command);
  }
});
