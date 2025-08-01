import { slugify } from "../lib/slugify";

test("slugify converts name", () => {
  expect(slugify("Финансовый советник")).toBe(
    encodeURIComponent("финансовый-советник"),
  );
  expect(slugify("Test Name")).toBe("test-name");
});
