const declaredTestPattern =
  /\b(?:it|test|describe)(?:\.(?:only|skip|todo|concurrent|fails))*\s*\(\s*(['"`])([^'"`\n]+)\1/g;

export function hasDeclaredJavaScriptTest(testText, testName) {
  if (!testName) {
    return false;
  }

  return Array.from(testText.matchAll(declaredTestPattern)).some(
    (match) => match[2] === testName
  );
}
