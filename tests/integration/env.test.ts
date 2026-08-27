describe("Test environment", () => {
  it("should load the test environment", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(process.env.DATABASE_URL).toContain("task_master_test");
  });
});
