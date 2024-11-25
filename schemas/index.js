import mongoose from "mongoose";

const connect = () => {
  mongoose
    .connect(
      "mongodb+srv://mvpalsdn771:abcd1234@express-mongo.z8efb.mongodb.net/?retryWrites=true&w=majority&appName=Express-Mongo",
      {
        dbName: "WorkListDB", // todo_memo 데이터베이스명을 사용합니다.
      },
    )
    .then(() => console.log("MongoDB 연결에 성공하였습니다."))
    .catch((err) => console.log(`MongoDB 연결에 실패하였습니다. ${err}`));
};

mongoose.connection.on("error", (err) => {
  console.error("MongoDB 연결 에러", err);
});

export default connect;
