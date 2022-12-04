type DidactPrimitive = string | number | boolean | undefined | null;
type DidactChild = DidactElement | DidactPrimitive;
type DidactProps = {
  [key: string]: any;
  children: DidactElement[];
};
type DidactElement = {
  type: string;
  props: DidactProps;
};
function createElement(
  type: string,
  props: DidactProps,
  ...children: DidactChild[]
) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text: DidactPrimitive) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function createDom(fiber: DidactElement) {
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);
  const isProperty = (key: string) => key !== "children";
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      (dom as any)[name] = fiber.props[name];
    });

  return dom;
}

type Container = HTMLElement | Text;

type DidactFiber = {
  dom?: Container;
  parent?: DidactFiber;
  child?: DidactFiber;
  sibling?: DidactFiber;
} & DidactElement;

let nextUnitOfWork: DidactFiber | undefined = undefined;

function render(element: DidactElement, container: HTMLElement | Text) {
  nextUnitOfWork = {
    type: "div",
    dom: container,
    props: {
      children: [element],
    },
  };
}

function workLoop(deadline: IdleDeadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber: DidactFiber): DidactFiber | undefined {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  if (fiber.parent) {
    fiber.parent.dom?.appendChild(fiber.dom);
  }

  const elements = fiber.props.children;
  let index = 0;
  let prevSibling: DidactFiber | undefined = undefined;

  while (index < elements.length) {
    const element = elements[index];
    const newFiber: DidactFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
    };

    if (index === 0) {
      fiber.child = newFiber;
    } else if (prevSibling) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber: DidactFiber | undefined = fiber;

  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

const Didact = {
  createElement,
  render,
};

/** @jsx Didact.createElement */
const element = (
  <div>
    <h1>Hello World</h1>
    <h2>from Didact</h2>
  </div>
);
const container = document.getElementById("root")!;
Didact.render(element, container);
