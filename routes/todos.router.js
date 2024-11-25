import express from "express";
import Todo from "../schemas/todo.schema.js";
import Joi from "joi";
const router = express.Router();

/* JOI 리팩토링 단계
1. `value` 데이터는 **필수적으로 존재**해야한다.
2. `value` 데이터는 **문자열 타입**이어야한다.
3. `value` 데이터는 **최소 1글자 이상**이어야한다.
4. `value` 데이터는 **최대 50글자 이하**여야한다.
5. 유효성 검사에 실패했을 때, 에러가 발생해야한다.
*/
const createdTodoSchema = Joi.object({
  value: Joi.string().min(1).max(50).required(),
});

// 할 일 등록 API
router.post("/todos", async (req, res, next) => {
  try {
    // 1. 클라에서 받아온 value 데이터 조회
    const validation = await createdTodoSchema.validateAsync(req.body);
    const { value } = validation;
    // 1-1. 클라가 value 데이터를 전달하지 않았을 때 에러메세지 출력
    if (!value)
      return res.status(400).json({
        errorMessage: "해야 할 일 데이터(value) 가 존재하지 않습니다.",
      });
    // 2. 해당하는 마지막 order 데이터 조회
    // findOne = 1개의 데이터만 조회하는 메서드
    // sort() = 매개변수 기준 정렬 : 일반적으로 오름차순, '-' 붙이면 내림차순
    const todoMaxOrder = await Todo.findOne().sort("-order").exec();
    // 3. 데이터가 있으면, 현재 해야 할 일 +1 / 없으면 1 로 할당
    const order = todoMaxOrder ? todoMaxOrder.order + 1 : 1;
    // 4. 해야 할 일 등록
    const todo = new Todo({ value, order });
    await todo.save(); //save 메서드를 실행해야 DB에 저장이 됨
    // 5. 등록한 일을 클라에 반환
    return res.status(201).json({ todo: todo });
  } catch (error) {
    //router 다음에 있는 에러 처리 미들웨어 실행
    next(error);
  }
});

// 할 일 조회 API
router.get("/todos", async (req, res, next) => {
  // 1. 할 일 목록 조회
  const todos = await Todo.find().sort("-order").exec();
  // 2. 조회 결과를 클라에 반환
  return res.status(200).json({ todos });
});

// 할 일 순서 변경, 완료 처리, 내용 수정 API
router.patch("/todos/:todoId", async (req, res, next) => {
  const { todoId } = req.params; // 바꾸려는 데이터의 id 값
  const { order, done, value } = req.body; // 바꾸려는 데이터의 순서, 완료 상태
  // 1. 현재 나의 order 가 무엇인지 알아야 함
  const currentTodo = await Todo.findById(todoId).exec();
  if (!currentTodo)
    return res.status(404).json({ errorMessage: "Data Not Found" });
  // 2. 순서 변경 작업
  if (order) {
    const targetTodo = await Todo.findOne({ order }).exec();
    if (targetTodo) {
      targetTodo.order = currentTodo.order;
      await targetTodo.save();
    }
    currentTodo.order = order;
  }
  if (done !== undefined) currentTodo.doneAt = done ? new Date() : null;
  if (value) currentTodo.value = value;

  await currentTodo.save();
  return res.status(200).json({});
});

// 할 일 삭제 API
router.delete("/todos/:todoId", async (req, res, next) => {
  const { todoId } = req.params;

  const todo = await Todo.findById(todoId).exec();
  if (!todo) return res.status(404).json({ errorMessage: "Data Not Found" });

  // _ 언더바를 써야 함 = 이게 위에서 전달받은 todoId 를 의미
  await Todo.deleteOne({ _id: todoId });
  return res.status(200).json({});
});

// 할 일 내용 변경 API
router.patch("/todos/:todoId", async (req, res, next) => {
  const { todoId } = req.params;
  const { value } = req.body;
  // 1. 바꾸려는 할 일 받아오고
  const targetTodo = await Todo.findById(todoId).exec();
  // 예외 처리 한번 해주고
  if (!targetTodo)
    return res.status(404).json({ errorMessage: "Data Not Found" });

  // 2. 내용 바꿔줌
  if (value) {
    targetTodo.value = value;
    targetTodo.save();
  }
  return res.status(200).json({});
});

export default router;
