export const FLOGO_FLOW_DIAGRAM_NODE_TYPE = {
  0: "NODE_PADDING",
  1: "NODE_HOLDER",
  2: "NODE_ADD",
  3: "NODE_ROOT",
  4: "NODE_ROOT_NEW",
  5: "NODE",
  6: "NODE_BRANCH",
  7: "NODE_LINK",
  8: "NODE_SUB_PROC",
  9: "NODE_LOOP",
  "NODE_PADDING": 0,   // padding node
  "NODE_HOLDER": 1,    // placeholder node
  "NODE_ADD": 2,       // node to add an activity
  "NODE_ROOT": 3,      // the trigger node
  "NODE_ROOT_NEW": 4,  // node to add a trigger
  "NODE": 5,           // activity node
  "NODE_BRANCH": 6,    // the branch line node
  "NODE_LINK": 7,      // the link node
  "NODE_SUB_PROC": 8,  // activity with sub flow
  "NODE_LOOP": 9       // repeatable activity
};

export const FLOGO_TASK_TYPE = {
  0: "TASK_ROOT",
  1: "TASK",
  2: "TASK_BRANCH",
  3: "TASK_SUB_PROC",
  4: "TASK_LOOP",
  "TASK_ROOT": 0,
  "TASK": 1,
  "TASK_BRANCH": 2,
  "TASK_SUB_PROC": 3,
  "TASK_LOOP": 4
};

export const FLOGO_PROCESS_TYPE = {
  1: "DEFAULT",
  "DEFAULT": 1
};

export const FLOGO_FLOW_DIAGRAM_FLOW_LINK_TYPE = {
  0: "DEFAULT",
  1: "BRANCH",
  2: "LABELED",
  "DEFAULT": 0,
  "BRANCH": 1,
  "LABELED": 2
};


export const FLOGO_TASK_ATTRIBUTE_TYPE = {
  0: "STRING",
  1: "INTEGER",
  2: "NUMBER",
  3: "BOOLEAN",
  4: "OBJECT",
  5: "ARRAY",
  6: "PARAMS",
  "STRING": 0,
  "INTEGER": 1,
  "NUMBER": 2,
  "BOOLEAN": 3,
  "OBJECT": 4,
  "ARRAY": 5,
  "PARAMS": 6
};
