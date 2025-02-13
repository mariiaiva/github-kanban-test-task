import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CardActionArea,
} from "@mui/material";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ItemType = "ISSUE";

const IssueCard = ({
  issue,
  index,
  columnKey,
  selectedCard,
  setSelectedCard,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index, issue, columnKey },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  });

  const createdDate = new Date(issue.created_at);
  const daysAgo = Math.floor(
    (new Date() - createdDate) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card
      ref={drag}
      sx={{
        height: "100%",
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <CardActionArea
        onClick={() => setSelectedCard(issue.id)}
        data-active={selectedCard === issue.id ? "" : undefined}
        sx={{
          height: "100%",
          "&[data-active]": {
            backgroundColor: "action.selected",
            "&:hover": {
              backgroundColor: "action.selectedHover",
            },
          },
        }}
      >
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="caption" color="text.secondary">
              Opened {daysAgo} days ago
            </Typography>
            <Typography variant="caption" fontWeight="bold">
              {columnKey.replace(/([A-Z])/g, " $1").trim()}
            </Typography>
          </Box>
          <Typography variant="h6" component="div" mt={1}>
            {issue.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {issue.user?.login} | Comments: {issue.comments}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const Column = ({
  title,
  issues,
  setIssues,
  columnKey,
  selectedCard,
  setSelectedCard,
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: ItemType,
    drop: (item) => moveIssue(item.issue, columnKey),
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  });

  const moveIssue = (issue, newColumn) => {
    setIssues((prev) => {
      const updatedIssues = { ...prev };
      Object.keys(updatedIssues).forEach((col) => {
        updatedIssues[col] = updatedIssues[col].filter(
          (i) => i.id !== issue.id
        );
      });
      updatedIssues[newColumn].push(issue);
      localStorage.setItem("issues", JSON.stringify(updatedIssues));
      return updatedIssues;
    });
  };

  return (
    <Box
      ref={drop}
      sx={{
        width: "100%",
        minHeight: 400,
        borderRadius: 2,
        p: 2,
        backgroundColor: isOver ? "grey.200" : "grey.100",
      }}
    >
      <Typography variant="h6" fontWeight="bold" textAlign="center" mb={2}>
        {title}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 2,
        }}
      >
        {issues.map((issue, index) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            index={index}
            moveIssue={moveIssue}
            columnKey={columnKey}
            selectedCard={selectedCard}
            setSelectedCard={setSelectedCard}
          />
        ))}
      </Box>
    </Box>
  );
};

export default function IssueBoard() {
  const [repoUrl, setRepoUrl] = useState("");
  const [issues, setIssues] = useState({ ToDo: [], InProgress: [], Done: [] });
  const [repoData, setRepoData] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    const savedIssues = JSON.parse(localStorage.getItem("issues"));
    if (savedIssues) setIssues(savedIssues);
  }, []);

  const fetchIssues = async () => {
    try {
      const match = repoUrl.match(/github.com\/(.*?\/.*?)$/);
      if (!match) return toast.error("Invalid URL");
      const repo = match[1];

      const [repoRes, issuesRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${repo}`).then((res) => res.json()),
        fetch(`https://api.github.com/repos/${repo}/issues?per_page=100`).then(
          (res) => res.json()
        ),
      ]);

      setRepoData(repoRes);

      const newIssues = {
        ToDo: issuesRes.filter((i) => !i.assignee && i.state === "open"),
        InProgress: issuesRes.filter((i) => i.assignee && i.state === "open"),
        Done: issuesRes.filter((i) => i.state === "closed"),
      };
      setIssues(newIssues);
      localStorage.setItem("issues", JSON.stringify(newIssues));
    } catch (error) {
      toast.error("Failed to load issues");
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ p: 4, maxWidth: "1200px", mx: "auto" }}>
        <Box display="flex" gap={2} mb={4}>
          <input
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="Enter repo URL"
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={fetchIssues}
            style={{
              padding: "8px 12px",
              background: "#007bff",
              color: "#fff",
              borderRadius: "4px",
              border: "none",
            }}
          >
            Load issues
          </button>
        </Box>

        {repoData && repoData.html_url && repoData.owner ? (
          <Box textAlign="center" mb={4}>
            <a
              href={repoData.html_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {repoData.full_name}
            </a>
            <span> | </span>
            <a
              href={repoData.owner.html_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {repoData.owner.login}
            </a>
          </Box>
        ) : (
          <Typography textAlign="center" color="text.secondary" mb={4}>
            No repository data loaded.
          </Typography>
        )}

        <Box display="flex" gap={2}>
          <Column
            title="To Do"
            issues={issues.ToDo}
            setIssues={setIssues}
            columnKey="ToDo"
            selectedCard={selectedCard}
            setSelectedCard={setSelectedCard}
          />
          <Column
            title="In Progress"
            issues={issues.InProgress}
            setIssues={setIssues}
            columnKey="InProgress"
            selectedCard={selectedCard}
            setSelectedCard={setSelectedCard}
          />
          <Column
            title="Done"
            issues={issues.Done}
            setIssues={setIssues}
            columnKey="Done"
            selectedCard={selectedCard}
            setSelectedCard={setSelectedCard}
          />
        </Box>
      </Box>

      <ToastContainer />
    </DndProvider>
  );
}

