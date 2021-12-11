//! Telegram Bot API for NodeJS https://www.npmjs.com/package/node-telegram-bot-api
const TelegramBot = require("node-telegram-bot-api");
//! To save this library to database should use npm: https://www.npmjs.com/package/sqlite-sync
var sqlite = require("sqlite-sync"); //requiring
let table = require("table");

// Predefined styles of table
let config = {
  drawHorizontalLine: (lineIndex, rowCount) => {
    return lineIndex === 0 || lineIndex === 1 || lineIndex === rowCount;
  },
};

//Connecting - if the file does not exist it will be created
sqlite.connect("./db/cursach.db");

//* -----SQLite DATABASE START-----
//Create table
//Creating table - you can run any command
sqlite.run(
  `CREATE TABLE IF NOT EXISTS Users(
    ID  INTEGER PRIMARY KEY NOT NULL UNIQUE,
    Nickname TEXT NOT NULL UNIQUE,
    isCoach INTEGER,
    Team_ID INTEGER
  );`,
  function (res) {
    if (res.error) throw res.error;
  }
);

const token = "2128129298:AAFA1UzIeGP81RMeR4cuREdKBMtA09or330";

const bot = new TelegramBot(token, { polling: true });

//* Starting Description
bot.onText(/\/start/, (msg) => {
  const chatID = msg.chat.id;
  const userData = msg.from;
  bot.sendSticker(
    chatID,
    "https://tlgrm.ru/_/stickers/35a/cc3/35acc3d9-6859-4b58-923e-bcb3d8779314/3.webp"
  );
  bot.sendMessage(
    chatID,
    "This bot is @karasu_tengo `s course work. \nI hope, I could help you with football league managment\n" +
      "To add message use command:\n" +
      "`/add key`\n" +
      "To list messages use command:\n" +
      "`/list`\n" +
      "To remove message use command:\n" +
      "`/remove key`\n"
  );
  sqlite.insert(
    "Users",
    {
      ID: userData.id,
      Nickname: userData.username,
    },
    (msg) => console.log(msg.error)
  );
});

//* GET message from database
bot.onText(/\/get ([^;'\"]+)/, (msg, match) => {
  const chatID = msg.chat.id;
  const key = match[1];
  // getMatchWithGoals(key)
  // getPlayerWhoScoreLaterThen(key);
  // getPlayerWithSurnameOn(key)
  // getTeamWithFirstLetter(key)
  // const response = getGoalInPeriod(key, chatID);
  // getMatchByPeriod(key, chatID)
  // howMuchGoals(key, chatID)
  // howMuchWins(key, chatID)
  // topScorers(chatID)
  // topWiners(chatID);
  // theGreatestAmountOfPlayers(chatID);
  // getLoosersOfYear(chatID)
  // getLeastScorer(chatID)
  // freeAgent(chatID)
  // getHigherAndLowerSalary(chatID)
  // getMaxAndMinWins(chatID)
  // getGoalsInMatches(chatID)
  getSumOfGoalsInMatch(chatID)
});

//* GET LIST of data
bot.onText(/\/list/, (msg) => {
  const chatId = msg.chat.id;
  const fromId = msg.from.id;
  const data = sqlite.run("SELECT `key` FROM messages WHERE `from_id` = ?", [
    fromId,
  ]); //only get column key from table messages //! --Done-- select key because we need to add key not all
  if (data.length == 0) {
    //check if the user write something or nor, if not send a message
    bot.sendMessage(chatId, "You did not add anything.");
    return;
  }
  // adding text
  var text = ""; //display it in a row
  var lines = []; // to add some comma
  data.forEach(function (element) {
    lines.push((text += "`" + element.key + "`"));
    //'`'  markdown //! --Done-- doesnt work something wrong with select
  });
  bot.sendMessage(chatId, lines.join(", "), { parse_mod: "markdown" });
});

//*DELETE function
bot.onText(/\/remove ([^;'\"]+) ([^;'\"]+) ([^;'\"]+)/, (msg, match) => {
  console.log("here");
  const table = firstLetterToUpper(match[1]);
  const column = firstLetterToUpper(match[2]);
  const value = match[3];
  console.log(table, column, value);

  sqlite.delete(`${table}`, { [column]: value }, function (res) {
    //Check if there is an err
    console.log(res);
    if (res.error) {
      bot.sendMessage(msg.chat.id, "Failed! Please, try later");
      return console.log(res.error);
    }
    bot.sendMessage(msg.chat.id, "Your message was delete");
  });
});

//* ADD message to database
//* /add + hi(key)
// add text [gif, audio, text, sticker]
const addMode = {}; //holding chatID and status
bot.onText(/\/add ([^;'\"]+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const key = match[1];
  let template;

  addMode[chatId] = { key, chatId };
  switch (key) {
    case "team":
      template = "Name, description, date-of-birth, city name";
      break;

    case "city":
      template = "City name, Country name";
      break;

    case "country":
      template = "Counrty name, Region Name";
      break;
  }
  const text = `Please input ${key} info using our template\nTEMPLATE:\n${template}`;

  bot.sendMessage(chatId, text);
});

//message listener
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const data = msg.text.split(",").map((item, index) => {
    return item.trim();
  });
  if (!(chatId in addMode)) {
    //! Debugging: problem with a key check
    return;
  }
  //*CANCEL insert
  if (typeof msg.text !== "undefined" && msg.text.toLowerCase() == "/cancel") {
    delete addMode[msg.chat.id];
    return;
  }

  //* Insert to database
  console.log(addMode);
  switch (addMode[chatId]["key"]) {
    //insert team to bd
    case "team":
      sqlite.run(
        "INSERT INTO Team(`Name`, `history`, `Date_of_Birth`, `City_ID`) SELECT ?, ?, ?, City.ID FROM City where City.City_name = ?",
        data.map((item, index) => {
          //string data to number. Temp solution
          if (index === 2) {
            item = +item;
          }
          //replace double quotes to single
          if (typeof item === "string") {
            item = item.replace(/^["'](.+(?=["']$))["']$/, "$1");
            return item;
          }
          console.log(item);
          return item;
        }),
        (res) => {
          if (res.error) {
            bot.sendMessage(chatId, "Failed. Please, try later");
            return console.log(res.error);
          }
          bot.sendMessage(
            chatId,
            "Successful. Your team added to our data base"
          );
        }
      );
      break;

    // insert new city to bd
    case "city":
      console.log("here");
      console.log(data, "in city");
      sqlite.run(
        "INSERT INTO City(`City_name`, `Country_ID`) SELECT ?, Country.ID FROM Country WHERE Country.Country_name = ?",
        data.map((item) => {
          //capitalize first letters
          if (typeof item === "string") {
            item = firstLetterToUpper(item);
            //replace double quotes to single
            return (item = item.replace(/^["'](.+(?=["']$))["']$/, "$1"));
          }
          return item;
        }),
        (res) => {
          if (res.error) {
            bot.sendMessage(chatId, "Failed. Please, try later");
            console.log(res.error);
          }
          bot.sendMessage(
            chatId,
            "Successful. New city added to our data base"
          );
        }
      );
      break;

    //insert new country to db
    case "country":
      sqlite.run(
        "INSERT INTO Country(`Country_name`, `Region_ID`) SELECT ?, Region.ID FROM Region where Region.Region_name = ?",
        data.map((item) => {
          if (typeof item === "string") {
            item = firstLetterToUpper(item);
            return (item = item.replace(/^["'](.+(?=["']$))["']$/, "$1"));
          }
          return item;
        }),
        (res) => {
          if (res.error) {
            bot.sendMessage(chatId, "Failed. Please, try later");
            return console.log(res.error);
          }
          bot.sendMessage(chatId, "Success. Country added.");
        }
      );
      break;
  }
  delete addMode[chatId]; //delete an object from chatId

  // send a message to the chat acknowledging receipt of their message
  // bot.sendMessage(chatId, JSON.stringify(msg)); // will get what was send to the function  bot.on
});

function firstLetterToUpper(str) {
  if (typeof str !== "string") {
    return console.log("FAILED! Argument must be a string");
  }
  return (str = str.charAt(0).toUpperCase() + str.slice(1));
}

//bd queries
function getMatchWithGoals(team, chatID) {
  const data = sqlite.run(
    'SELECT * from "Match" where `Result_a` + `Result_B` > 1 and `TeamA_ID` = (SELECT `ID` from "Team" WHERE `Name` = $name) OR `TeamB_ID` = (SELECT `ID` from "Team" WHERE `Name` = $name)',
    { $name: team },
    (res) => {
      if (res.length > 0) {
        return printResult(res, chatID);
      }
      bot.sendMessage(chatID, "Something went wrong!");
    }
  );
  return data;
}

function getPlayerWhoScoreLaterThen(time, chatID) {
  const data = sqlite.run(
    'SELECT * FROM "Players" join "Goal" on "Goal".`Player_ID` = "Players".`ID` WHERE time("Goal".`Time`) > time($time)',
    { $time: time },
    (res) => {
      if (res.length > 0) {
        return printResult(res, chatID);
      }
      bot.sendMessage(chatID, "Something went wrong!");
    }
  );
  return data;
}

function getPlayerWithSurnameOn(letter, chatID) {
  const data = sqlite.run(
    "SELECT * from Players WHERE Surname LIKE $letter",
    { $letter: letter + "%" },
    (res) => {
      if (res.length > 0) {
        return printResult(res, chatID);
      }
      bot.sendMessage(chatID, "Something went wrong!");
    }
  );
  return data;
}

function getTeamWithFirstLetter(letter, chatID) {
  const data = sqlite.run(
    "SELECT * from Team WHERE Name LIKE $letter",
    { $letter: letter + "%" },
    (res) => {
      if (res.length > 0) {
        return printResult(res, chatID);
      }
      bot.sendMessage(chatID, "Something went wrong!");
    }
  );
  return data;
}

function getGoalInPeriod(time, chatID) {
  time = time.split(" ");
  const data = sqlite.run(
    "SELECT `Surname`, Goal.`Time` from Players join Goal on Goal.`Player_ID` = `Player_ID` where time(Goal.`Time`) BETWEEN time($firstLimit) AND time($secondLimit) and Goal.`Player_ID` = Players.`ID`",
    { $firstLimit: time[0], $secondLimit: time[1] },
    (res) => {
      if (res.length > 0) {
        return printResult(res, chatID);
      }
      bot.sendMessage(chatID, "Something went wrong!");
    }
  );
  return data;
}

function getMatchByPeriod(date, chatID) {
  date = date.split(" ");
  const data = sqlite.run(
    'select date("Match".`Date`) as Match_Date, t1.`Name` as TeamA, t2.`Name` as TeamB from "Match" inner join Team t1 on t1.`ID` = "Match".`TeamA_ID` inner join Team t2 on t2.`ID` = "Match".`TeamB_ID` where Match_Date BETWEEN date($firstLimit) and date($secondLimit)',
    { $firstLimit: date[0], $secondLimit: date[1] },
    (res) => {
      if (res.length > 0) {
        return printResult(res, chatID);
      }
      console.log(res);
      bot.sendMessage(chatID, "Something went wrong!");
    }
  );
  return data;
}

function howMuchGoals(name, chatID){
  name = firstLetterToUpper(name)
  const data = sqlite.run('SELECT COUNT(`Player_ID`) as amount_of_goals from Goal where `Player_ID` = (SELECT Players.`ID` from Players where Players.`Surname` = $name)',
    { $name: name },
    (res) => {
      if (res.length > 0) {
        return printResult(res, chatID);
      }
      console.log(res);
      bot.sendMessage(chatID, "Something went wrong!");
    }
  );
  return data;
}

function howMuchWins(name, chatID){
  name = firstLetterToUpper(name)
  const data = sqlite.run('SELECT COUNT(*) as amount_of_wins from "Match" where "Match".Winner_ID = (SELECT Team.ID from Team where Team.Name = $name)',
    { $name: name },
    (res) => {
      if (res.length > 0) {
        return printResult(res, chatID);
      }
      console.log(res);
      bot.sendMessage(chatID, "Something went wrong!");
    }
  );
  return data;
}

function topScorers (chatID){
  const data = sqlite.run('SELECT Players.`Surname`, COUNT(`Player_ID`) as amount_of_goals from Goal inner join Players on Players.`ID` = Goal.`Player_ID` group by `Player_ID` ORDER by amount_of_goals DESC',
    (res) => {
      if (res.length > 0) {
        return printResult(res, chatID);
      }
      console.log(res);
      bot.sendMessage(chatID, "Something went wrong!");
    }
  );
  return data;
}

function topWiners (chatID){
  const data = sqlite.run('SELECT Team.Name, City.City_name, COUNT(Winner_ID) as amount_of_wins from "Match" inner join Team on Team.`ID` = "Match".`Winner_ID` inner join City where City.`ID` = Team.`City_ID` group by `Winner_ID` order by amount_of_wins DESC',
    (res) => {
      if (res.length > 0) {
        return printResult(res, chatID);
      }
      console.log(res);
      bot.sendMessage(chatID, "Something went wrong!");
    }
  );
  return data;
}

function theGreatestAmountOfPlayers (chatID){
  const data = sqlite.run('SELECT Team.`Name`, City.`City_name`, count("Team-Player".`Team_ID`) as "amount of players" from Team inner join City on City.`ID` = Team.`City_ID` inner join "Team-Player" on "Team-Player".`Team_ID` = Team.`ID` group by Team.`Name`, Team.`ID` HAVING  count("Team-Player".`Team_ID`) >= ( SELECT count("Team-Player".`Team_ID`) from "Team-Player" group by `Team_ID` )',
    (res) => {
      if (res.length > 0) {
        return printResult(res, chatID);
      }
      console.log(res);
      bot.sendMessage(chatID, "Something went wrong!");
    }
  );
  return data;
}

function getLoosersOfYear(chatID){
  const data = sqlite.run('SELECT Team.`ID`, Team.`Name`, City.`City_name` from Team inner join City on City.`ID` = Team.`City_ID` where Team.`ID` not in (SELECT "Match".`Winner_ID` from "Match" WHERE date("Match".Date) >= date("now", "start of year") )',
    (res) => {
      if (res.length > 0) {
        return printResult(res, chatID);
      }
      console.log(res);
      bot.sendMessage(chatID, "Something went wrong!");
    }
  );
  return data;
}

function getLeastScorer(chatID){
  const data = sqlite.run('SELECT Players.`ID`, Players.`Surname`, Team.`Name` from Players inner join "Team-Player" on "Team-Player".`Player_ID` = Players.`ID` inner join Team on Team.`ID` = "Team-Player".`Team_ID` where not EXISTS ( select Goal.`Player_ID` from Goal where Players.`ID` = Goal.`Player_ID` )',
    (res) => {
      if (res.length > 0) {
        return printResult(res, chatID);
      }
      console.log(res);
      bot.sendMessage(chatID, "Something went wrong!");
    }
  );
  return data;
}

function freeAgent(chatID){
  const data = sqlite.run('SELECT Players.`Surname` from Players left join "Team-Player" on "Team-Player".`Player_ID` = Players.`ID` where "Team-Player".`Player_ID` is NULL',
    (res) => {
      if (res.length > 0) {
        return printResult(res, chatID);
      }
      console.log(res);
      bot.sendMessage(chatID, "Something went wrong!");
    }
  );
  return data;
}

function getMaxAndMinWins(chatID){
  const data = sqlite.run('SELECT Team.`ID`, Team.`Name`, count("Match".`Winner_ID`) as amount_of_wins, "наибольшие кол-во побед" as `status` from Team inner join "Match" on Match.`Winner_ID` = Team.`ID` group by "Match".`Winner_ID` HAVING amount_of_wins >= ( select count("Match".`Winner_ID`) as count from "Match" group by "Match".`Winner_ID` ORDER BY -count LIMIT 1 ) UNION SELECT Team.`ID`, Team.`Name`, count("Match".`Winner_ID`) as amount_of_wins, "lowest кол-во побед" as `status` from Team inner join "Match" on Match.`Winner_ID` = Team.`ID` group by "Match".`Winner_ID` HAVING amount_of_wins <= ( select count("Match".`Winner_ID`) as count from "Match" group by "Match".`Winner_ID` ORDER BY count LIMIT 1)',
  (res) => {
    if (res.length > 0) {
      return printResult(res, chatID);
    }
    console.log(res);
    bot.sendMessage(chatID, "Something went wrong!");
  }
);
return data;
}

function getHigherAndLowerSalary(chatID){
  const data = sqlite.run('SELECT Players.`ID`, Players.`Surname`, "The most expensive" as `status`, MAX(Players.`Salary`) as Salary, Team.`Name` as Team from Players inner join "Team-Player" on "Team-Player".`Player_ID` = Players.`ID` inner join Team on Team.`ID` = "Team-Player".`Team_ID` UNION SELECT Players.`ID`, Players.`Surname`, "The cheapest" as `status`, MIN(Players.`Salary`) as Salary, Team.`Name` as Team from Players inner join "Team-Player" on "Team-Player".`Player_ID` = Players.`ID` inner join Team on Team.`ID` = "Team-Player".`Team_ID`',
    (res) => {
      if (res.length > 0) {
        return printResult(res, chatID);
      }
      console.log(res);
      bot.sendMessage(chatID, "Something went wrong!");
    }
  );
  return data;
}

function getGoalsInMatchesByPlayers(chatID){
  const data = sqlite.run('SELECT Players.`Surname`, t1.`Name` || "-" || t2.`Name` as "Match", count(Goal.`Match_ID`) as "goals in match" from Goal inner join Players on Players.`ID` = Goal.`Player_ID` inner join "Match" on "Match".`ID` = Goal.`Match_ID` inner join Team t1 on t1.`ID` = "Match".`TeamA_ID` inner join Team t2 on t2.`ID` = "Match".`TeamB_ID` GROUP by "Match".`ID`, Players.`ID` having count(Goal.`Match_ID`) >= ( SELECT count(Goal.`Match_ID`) from Goal group by Goal.`Match_ID` ) ORDER BY -"goals in match"',
    (res) => {
      if (res.length > 0) {
        return printResult(res, chatID);
      }
      console.log(res);
      bot.sendMessage(chatID, "Something went wrong!");
    }
  );
  return data;
}

function getSumOfGoalsInMatch(chatID){
  const data = sqlite.run('SELECT t1.`Name` || "-" || t2.`Name` as "Match", m.`Date`, case when Goal.`ID` is null then 0 else count(Goal.`ID`) end as "goals" from "Match" m left join Goal on Goal.`Match_ID` = m.`ID` inner join Team t1 on t1.`ID` = m.`TeamA_ID` inner join Team t2 on t2.`ID` = m.`TeamB_ID` GROUP BY m.`ID`',
    (res) => {
      if (res.length > 0) {
        return printResult(res, chatID);
      }
      console.log(res);
      bot.sendMessage(chatID, "Something went wrong!");
    }
  );
  return data;
}


function printResult(res, chatID) {
  const titleRow = Array.from(Object.keys(res[0]));
  const formatedResponse = [
    titleRow,
    ...res.map((obj) => {
      const dataRow = Array.from(Object.values(obj));
      return dataRow;
    }),
  ];
  dataTable = table.table(formatedResponse, config);
  bot.sendMessage(chatID, "```" + dataTable + "```", {
    parse_mode: "Markdown",
  });
}


bot.on("polling_error", (msg) => console.log(msg));
