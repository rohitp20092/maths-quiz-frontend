import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import {
  Card,
  Input,
  Button,
  Typography,
  Row,
  Col,
  Table,
  Modal,
  message,
} from "antd";
import {
  TrophyOutlined,
  UserOutlined,
  NumberOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

function MathQuizApp() {
  const [socket, setSocket] = useState(null);
  const [problem, setProblem] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [username, setUsername] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [winner, setWinner] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const newSocket = io("https://maths-quiz-backend.onrender.com", {
      transports: ["websocket", "polling"],
    });
    setSocket(newSocket);

    newSocket.on("newProblem", (problemData) => {
      setProblem(problemData);
      setWinner(null);
      setUserAnswer("");
    });

    newSocket.on("winner", (data) => {
      setWinner(data.username);
      setLeaderboard(data.leaderboard);
      setQuestionCount(data.questionCount);
      message.success(`${data.username} solved the problem!`);
    });

    newSocket.on("gameOver", (data) => {
      setGameOver(true);
      setWinner(data.winner.username);
      setLeaderboard(data.leaderboard);
      Modal.success({
        title: "Game Over",
        content: `The winner is ${data.winner.username} with ${data.winner.score} points!`,
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleJoin = () => {
    if (username && socket) {
      socket.emit("joinGame", { username });
      setGameStarted(true);
    }
  };

  const handleSubmit = () => {
    if (socket && problem && userAnswer) {
      socket.emit("submitAnswer", {
        answer: Number(userAnswer),
        username,
      });
    }
  };

  const leaderboardColumns = [
    {
      title: "Rank",
      dataIndex: "rank",
      key: "rank",
      render: (text, record, index) => index + 1,
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Score",
      dataIndex: "score",
      key: "score",
    },
  ];

  if (!gameStarted) {
    return (
      <Modal title="Join Math Quiz" open={true} footer={null} closable={false}>
        <Input
          prefix={<UserOutlined />}
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <Button type="primary" block onClick={handleJoin}>
          Join Game
        </Button>
      </Modal>
    );
  }

  return (
    <Row
      gutter={[16, 16]}
      style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}
    >
      <Col xs={24} md={16}>
        <Card
          title={
            <Title level={3}>
              <NumberOutlined /> Math Challenge
              <Text style={{ marginLeft: 16, fontSize: 16 }}>
                Question: {questionCount}/10
              </Text>
            </Title>
          }
        >
          {!gameOver && problem && (
            <>
              <Title
                level={2}
                style={{ textAlign: "center", marginBottom: 24 }}
              >
                {problem.question}
              </Title>

              {winner && (
                <Text
                  type="success"
                  style={{
                    textAlign: "center",
                    display: "block",
                    marginBottom: 16,
                  }}
                >
                  Winner of this round: {winner}
                </Text>
              )}

              <Row gutter={8}>
                <Col span={16}>
                  <Input
                    prefix={<NumberOutlined />}
                    placeholder="Your answer"
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={winner !== null}
                  />
                </Col>
                <Col span={8}>
                  <Button
                    type="primary"
                    block
                    onClick={handleSubmit}
                    disabled={winner !== null}
                  >
                    Submit
                  </Button>
                </Col>
              </Row>
            </>
          )}

          {gameOver && (
            <div style={{ textAlign: "center", padding: 24 }}>
              <Title level={2}>Game Completed!</Title>
              <Text>Final Leaderboard Determines the Winner</Text>
            </div>
          )}
        </Card>
      </Col>

      <Col xs={24} md={8}>
        <Card
          title={
            <Title level={4}>
              <TrophyOutlined /> Leaderboard
            </Title>
          }
        >
          <Table
            dataSource={leaderboard}
            columns={leaderboardColumns}
            pagination={false}
            rowKey="username"
          />
        </Card>
      </Col>
    </Row>
  );
}

export default MathQuizApp;
