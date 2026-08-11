// one mutable bit. Answers is this process ready to take new work
// On after listening succeeds
// Off first thing after shutdown is inited.

let ready = false;

export const setReady = (value: boolean): void => {
  ready = value;
};

export const isReady = (): boolean => {
  return ready;
};
