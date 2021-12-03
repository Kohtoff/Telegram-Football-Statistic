const sqlite = require("sqlite-sync");

//connectio to db
sqlite.connect("./db/cursach.db");

//bot api
const TelegramAPI = require("node-telegram-bot-api");
const { sql, db } = require("sqlite-sync");

//access token for bot
const token = "2128129298:AAFA1UzIeGP81RMeR4cuREdKBMtA09or330";

const bot = new TelegramAPI(token, { polling: true });

//poiling errors catcher
bot.on("polling_error", (err) => console.log(err));

bot.onText(/\/start/, (msg, match) => {
  const chatID = msg.chat.id;
  const { username } = msg.from;
  bot.sendSticker(
    chatID,
    "https://tlgrm.ru/_/stickers/35a/cc3/35acc3d9-6859-4b58-923e-bcb3d8779314/3.webp"
  );
  bot.sendMessage(
    chatID,
    `Glad to see you ${username})\nIt is a @karasu_tengo course work`
  );
});

const getUser = (nickname) => {
  const data = sqlite.run("SELECT * FROM User WHERE `Nickname` = ?", [
    nickname,
  ]);
  if (data.length === 0 || data == undefined) {
    return { exists: false };
  }
  return { ...data, exists: true };
};
const createPayload = () => {};
const getTeam = () => {
  console.log("in get team");
  const data = sqlite.run(
    "SELECT Team.Name, City.City_name, Team.ID from Team join City on City.ID = Team.City_ID"
  );
  console.log(data, "in get");
  if (data.length === 0) {
    return { exists: false };
  }
  return data;
};

const getCityDataByName = (name) => {
  const searchStr = name.trim();
  searchStr.replace(/^["'](.+(?=["']$))["']$/, "$1");

  const cityData = sqlite.run(
    "SELECT Country.Country_name, City.City_name, City.ID FROM City JOIN Country ON Country.ID = City.Country_ID WHERE City.City_name = ?",
    [searchStr]
  );
  if (cityData.length === 0) {
    return false;
  }
  return cityData;
};

const printUserInfo = (user) => {
  const { Name, Surname, Nickname } = user;
  return `Looks what i have. \nName: ${Name}\nSurname: ${Surname}\nNickname: ${Nickname}\n`;
};

const insertTeam = async (payload) => {
  await sqlite.insert(
    "INSERT INTO Team(`Name`, `history`, `Date_of_Birth`, `City_ID`) VALUES ('?', '?', '?', ?)",
    payload,
    (msg) => console.log(payload, "IN INSERT")
  );
};

const clarifyCity = (cityData, chatID) => {
  let result;
  const cityBtnItem = cityData.map((item) => {
    return {
      text: `${item.City_name}, ${item.Country_name}`,
      callback_data: `city ${item.ID}`,
    };
  });

  const cityBtns = {
    reply_markup: JSON.stringify({
      inline_keyboard: [cityBtnItem],
    }),
  };
  bot.sendMessage(
    chatID,
    "What city do you mean? \nIf didn`t find your city use /AddCity",
    cityBtns
  );
  bot.on("callback_query", async (msg) => {
    const callBackData = msg.data;
    callBackData[callBackData.length - 1] = callBackData.split(" ")[1];
    console.log(callBackData, "in callback query");
    result = callBackData.split(' ')[1]
  });
  return result;
};

bot.onText(/\/addTeam/, async (msg) => {
  const chatID = msg.chat.id;

  await bot.sendMessage(
    chatID,
    "Please, use our template to create new team\nExample:\n/TeamData Name, description, date.of.birth, city"
  );
  // await bot.on("message", async (msg) => {
  //   const chatID = msg.chat.id;
  //   let data = msg.text.split(",");
  //   let cityData = await getCityDataByName(data[data.length - 1]);

  //   if (cityData.length > 1) {
  //     const cityID = await clarifyCity(cityData, chatID);
  //     console.log(cityID);
  //   } else {
  //     await console.log("else");
  //   }
  //   await insertTeam(data);
  // });
});

bot.onText(/\/TeamData (.+)/, (msg, match) => {
  const chatID = msg.chat.id;
  const data = match[1].split(",");
  let cityData = getCityDataByName(data[data.length - 1]);

  if (cityData.length > 1) {
    cityData = clarifyCity(cityData, chatID);
    console.log(cityData, 'hey');
  } else {
    console.log("else");
  }
  console.log(insertTeam(data));
});

bot.onText(/\/signUp/, async (msg, match) => {
  const chatID = msg.chat.id;
  const { username, first_name, last_name, id } = msg.from;
  const user = getUser(username);
  const teams = getTeam();

  if (!user.exists) {
    let isCoach;
    let Team_ID;
    const isCoachBtn = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [
            { text: "coach", callback_data: "cocah" },
            { text: "fan", callback_data: "fan" },
          ],
        ],
      }),
    };

    await bot.sendMessage(
      chatID,
      "I like new meetings) Tell me about yourself\nAre you coach or just a fan?",
      isCoachBtn
    );
    await bot.on("callback_query", (msg) => {
      const data = msg.data;
      console.log(data, "in query handler");
      switch (data) {
        case "cocah":
          isCoach = 1;
          break;

        case "fan":
          isCoach = 0;
          break;

        case data.split(" ")[0] === "team":
          Team_ID = data.split(" ")[1];
          break;
      }
    });
    const selectTeamBtnArr = teams.map((item) => {
      return {
        text: `${item.Name} ${item.City_name}`,
        callback_data: `team ${item.ID}`,
      };
    });
    console.log(selectTeamBtnArr, "select");
    const selectTeam = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          selectTeamBtnArr,
          [{ text: "I didn`t find my team", callback_data: -1 }],
        ],
      }),
    };
    bot.sendMessage(
      chatID,
      "Is your team there?\nIf not, you can make new team using command /addTeam",
      selectTeam
    );
    // await bot.on("callback_query", (msg) => {
    //   const data = msg.data;
    //   console.log('here in event listener');
    //   if (data) {
    //     return Team_ID = data;
    //   }
    //   return;
    // });
  } else {
    bot.sendMessage(chatID, printUserInfo(user));
  }
});
