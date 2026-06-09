import { computeKeyboardAvoidHeight } from '../keyboard-avoidance';

describe('computeKeyboardAvoidHeight', () => {
  it('returns the full auto height when the widget already fits above the keyboard', () => {
    expect(
      computeKeyboardAvoidHeight({
        autoHeight: 300,
        containerTopY: 0,
        keyboardTopY: 600,
      })
    ).toBe(300);
  });

  it('does not cap when the available space exactly equals the content height', () => {
    expect(
      computeKeyboardAvoidHeight({
        autoHeight: 400,
        containerTopY: 100,
        keyboardTopY: 500,
      })
    ).toBe(400);
  });

  it('caps tall content to the space between the widget top and the keyboard', () => {
    // 2000px of content, widget starts at y=100, keyboard top at y=500 => 400px visible
    expect(
      computeKeyboardAvoidHeight({
        autoHeight: 2000,
        containerTopY: 100,
        keyboardTopY: 500,
      })
    ).toBe(400);
  });

  it('uses the visible band height when the widget is scrolled partly off the top of the screen', () => {
    expect(
      computeKeyboardAvoidHeight({
        autoHeight: 2000,
        containerTopY: -300,
        keyboardTopY: 500,
      })
    ).toBe(800);
  });

  it('clamps to a minimum height when the widget is almost entirely behind the keyboard', () => {
    expect(
      computeKeyboardAvoidHeight({
        autoHeight: 2000,
        containerTopY: 480,
        keyboardTopY: 500,
      })
    ).toBe(120);
  });

  it('honors a custom minimum height', () => {
    expect(
      computeKeyboardAvoidHeight({
        autoHeight: 2000,
        containerTopY: 480,
        keyboardTopY: 500,
        minHeight: 60,
      })
    ).toBe(60);
  });
});
