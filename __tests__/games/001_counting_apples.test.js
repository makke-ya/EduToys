/**
 * @jest-environment jsdom
 */

// テスト対象の関数をモック
let gameState = {
  total: 5,
  tapped: 0,
  isFinished: false
};

function tapApple(id) {
  if (gameState.isFinished) return;
  gameState.tapped++;
  if (gameState.tapped === gameState.total) {
    gameState.isFinished = true;
  }
  return gameState.tapped;
}

describe('001_counting_apples', () => {
  beforeEach(() => {
    gameState = {
      total: 5,
      tapped: 0,
      isFinished: false
    };
  });

  test('タップするとカウントが増える', () => {
    expect(tapApple(1)).toBe(1);
    expect(gameState.tapped).toBe(1);
  });

  test('すべてのリンゴをタップすると終了する', () => {
    tapApple(1);
    tapApple(2);
    tapApple(3);
    tapApple(4);
    tapApple(5);
    expect(gameState.tapped).toBe(5);
    expect(gameState.isFinished).toBe(true);
  });

  test('終了後はタップしてもカウントが増えない', () => {
    gameState.tapped = 5;
    gameState.isFinished = true;
    tapApple(6);
    expect(gameState.tapped).toBe(5);
  });
});
