import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { toast } from "react-toastify";

global.fetch = jest.fn();

jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe("IssueBoard Component", () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it("should render the initial layout with columns and empty state", () => {
    render(<App />);
    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("should show toast error if invalid repo URL is entered", async () => {
    render(<App />);

    const input = screen.getByPlaceholderText("Enter repo URL");
    const button = screen.getByText("Load issues");

    userEvent.type(input, "invalid-url");
    userEvent.click(button);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid URL");
    });
  });

  it("should fetch and display issues when valid repo URL is provided", async () => {
    fetch
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            full_name: "test/repo",
            html_url: "https://github.com/test/repo",
            owner: {
              login: "testOwner",
              html_url: "https://github.com/testOwner",
            },
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve([
            {
              id: 1,
              title: "Issue 1",
              state: "open",
              assignee: null,
              created_at: "2025-01-01T00:00:00Z",
              comments: 1,
              user: { login: "user1" },
            },
            {
              id: 2,
              title: "Issue 2",
              state: "open",
              assignee: { login: "user2" },
              created_at: "2025-01-02T00:00:00Z",
              comments: 2,
              user: { login: "user2" },
            },
            {
              id: 3,
              title: "Issue 3",
              state: "closed",
              assignee: null,
              created_at: "2025-01-03T00:00:00Z",
              comments: 3,
              user: { login: "user3" },
            },
          ]),
      });

    render(<App />);

    const input = screen.getByPlaceholderText("Enter repo URL");
    const button = screen.getByText("Load issues");

    userEvent.type(input, "https://github.com/test/repo");
    userEvent.click(button);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));

    expect(screen.getByText("Issue 1")).toBeInTheDocument();
    expect(screen.getByText("Issue 2")).toBeInTheDocument();
    expect(screen.getByText("Issue 3")).toBeInTheDocument();

    expect(screen.getByText("test/repo")).toBeInTheDocument();
    expect(screen.getByText("testOwner")).toBeInTheDocument();
  });

  it("should allow selecting a card and highlight it", async () => {
    fetch
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            full_name: "test/repo",
            html_url: "https://github.com/test/repo",
            owner: {
              login: "testOwner",
              html_url: "https://github.com/testOwner",
            },
          }),
      })
      .mockResolvedValueOnce({
        json: () =>
          Promise.resolve([
            {
              id: 1,
              title: "Issue 1",
              state: "open",
              assignee: null,
              created_at: "2025-01-01T00:00:00Z",
              comments: 1,
              user: { login: "user1" },
            },
          ]),
      });

    render(<App />);

    const input = screen.getByPlaceholderText("Enter repo URL");
    const button = screen.getByText("Load issues");
    userEvent.type(input, "https://github.com/test/repo");
    userEvent.click(button);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const issueCard = screen.getByText("Issue 1");
    userEvent.click(issueCard);

    expect(issueCard).toHaveStyle("background-color: action.selected");
  });
});
