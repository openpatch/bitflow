import { DoResult } from "@bitflow/core";

export const generateDoResult = async (): Promise<DoResult> => ({
  endDate: new Date("2021-04-14T07:35:39.741Z"),
  startDate: new Date("2021-04-13T07:35:39.741Z"),
  maxPoints: 10,
  points: 5,
  tries: [
    {
      status: "finished",
      try: 0,
      startDate: new Date("2021-04-13T07:35:39.741Z"),
      node: {
        type: "task",
        id: "45a2e52f-7ef9-468d-a377-1b09ded7179e",
        data: {
          name: "Definition Algorithm",
          view: {
            instruction:
              "Which of the following is the best definition of an algorithm?",
            variant: "single",
            choices: [
              {
                markdown:
                  "A well-ordered collection of unambiguous statements that when executed produces a result and halts in a reasonably short amount of time.",
              },
              {
                markdown:
                  "A well-ordered collection of unambiguous computable operations that when executed produces a result and halts in a finite amount of time.",
              },
              {
                markdown:
                  "A collection of unambiguous statements that when executed produces a result and halts in a finite amount of time.",
              },
              {
                markdown:
                  "A well-ordered collection of unambiguous statements that when executed produces a result.",
              },
              {
                markdown:
                  "A well-ordered collection of unambiguous statements.",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:41.745Z"),
      answer: {
        subtype: "choice",
        checked: {
          b: true,
        },
      },
      result: {
        subtype: "choice",
        state: "correct",
        choices: {
          a: {
            state: "correct",
          },
          b: {
            state: "correct",
          },
          c: {
            state: "correct",
          },
          d: {
            state: "correct",
          },
          e: {
            state: "correct",
          },
          f: {
            state: "correct",
          },
          g: {
            state: "correct",
          },
          h: {
            state: "correct",
          },
        },
        allowRetry: true,
      },
    },
    {
      status: "finished",
      try: 0,
      startDate: new Date("2021-04-13T07:35:42.335Z"),
      node: {
        type: "task",
        id: "14abdd58-5a56-4132-ba40-def3fac4deb0",
        data: {
          name: "Bool Expression",
          view: {
            instruction:
              "After the assignments `a = true` and `b = true`, what is returned by `(not a or b) and (a or not b)`?",
            variant: "single",
            choices: [
              {
                markdown: "true",
              },
              {
                markdown: "false",
              },
              {
                markdown: "an error",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:44.333Z"),
      answer: {
        subtype: "choice",
        checked: {
          c: true,
        },
      },
      result: {
        subtype: "choice",
        state: "wrong",
        choices: {
          a: {
            state: "wrong",
          },
          b: {
            state: "correct",
          },
          c: {
            state: "wrong",
            feedback: {
              message: "The expression is valid and will not return an error.",
              severity: "error",
            },
          },
          d: {
            state: "correct",
          },
          e: {
            state: "correct",
          },
          f: {
            state: "correct",
          },
          g: {
            state: "correct",
          },
          h: {
            state: "correct",
          },
        },
        allowRetry: true,
      },
    },
    {
      status: "finished",
      try: 1,
      startDate: new Date("2021-04-13T07:35:44.650Z"),
      node: {
        type: "task",
        id: "14abdd58-5a56-4132-ba40-def3fac4deb0",
        data: {
          name: "Bool Expression",
          view: {
            instruction:
              "After the assignments `a = true` and `b = true`, what is returned by `(not a or b) and (a or not b)`?",
            variant: "single",
            choices: [
              {
                markdown: "true",
              },
              {
                markdown: "false",
              },
              {
                markdown: "an error",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:46.691Z"),
      answer: {
        subtype: "choice",
        checked: {
          a: true,
        },
      },
      result: {
        subtype: "choice",
        state: "correct",
        choices: {
          a: {
            state: "correct",
          },
          b: {
            state: "correct",
          },
          c: {
            state: "correct",
          },
          d: {
            state: "correct",
          },
          e: {
            state: "correct",
          },
          f: {
            state: "correct",
          },
          g: {
            state: "correct",
          },
          h: {
            state: "correct",
          },
        },
        allowRetry: true,
      },
    },
    {
      status: "finished",
      try: 0,
      startDate: new Date("2021-04-13T07:35:47.046Z"),
      node: {
        type: "task",
        id: "04645e2a-0617-4007-81a7-acf11ab34938",
        data: {
          name: "Operator Names",
          view: {
            instruction:
              "Consider this section of code.\n```c\nint a = 3, b = 4, c = 5;\n\nbool x = a * b <= c;\n```\nThe expression contains an arithmetic operator, an assignment operator and a relational operator. Which is which?",
            variant: "single",
            choices: [
              {
                markdown: "```\n= Arithmetic\n* Assignment\n<= Relation\n```",
              },
              {
                markdown: "```\n* Arithmetic\n<= Assignment\n= Relation\n```",
              },
              {
                markdown: "```\n<= Arithmetic\n* Assignment\n= Relation\n```",
              },
              {
                markdown: "```\n* Arithmetic\n= Assignment\n<= Relation\n```",
              },
              {
                markdown: "```\n<= Arithmetic\n= Assignment\n* Relation\n```",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:48.840Z"),
      answer: {
        subtype: "choice",
        checked: {
          a: true,
        },
      },
      result: {
        subtype: "choice",
        state: "wrong",
        choices: {
          a: {
            state: "wrong",
          },
          b: {
            state: "correct",
          },
          c: {
            state: "correct",
          },
          d: {
            state: "wrong",
          },
          e: {
            state: "correct",
          },
          f: {
            state: "correct",
          },
          g: {
            state: "correct",
          },
          h: {
            state: "correct",
          },
        },
        allowRetry: true,
      },
    },
    {
      status: "finished",
      try: 1,
      startDate: new Date("2021-04-13T07:35:49.195Z"),
      node: {
        type: "task",
        id: "04645e2a-0617-4007-81a7-acf11ab34938",
        data: {
          name: "Operator Names",
          view: {
            instruction:
              "Consider this section of code.\n```c\nint a = 3, b = 4, c = 5;\n\nbool x = a * b <= c;\n```\nThe expression contains an arithmetic operator, an assignment operator and a relational operator. Which is which?",
            variant: "single",
            choices: [
              {
                markdown: "```\n= Arithmetic\n* Assignment\n<= Relation\n```",
              },
              {
                markdown: "```\n* Arithmetic\n<= Assignment\n= Relation\n```",
              },
              {
                markdown: "```\n<= Arithmetic\n* Assignment\n= Relation\n```",
              },
              {
                markdown: "```\n* Arithmetic\n= Assignment\n<= Relation\n```",
              },
              {
                markdown: "```\n<= Arithmetic\n= Assignment\n* Relation\n```",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:50.301Z"),
      answer: {
        subtype: "choice",
        checked: {
          b: true,
        },
      },
      result: {
        subtype: "choice",
        state: "wrong",
        choices: {
          a: {
            state: "correct",
          },
          b: {
            state: "wrong",
          },
          c: {
            state: "correct",
          },
          d: {
            state: "wrong",
          },
          e: {
            state: "correct",
          },
          f: {
            state: "correct",
          },
          g: {
            state: "correct",
          },
          h: {
            state: "correct",
          },
        },
        allowRetry: true,
      },
    },
    {
      status: "finished",
      try: 2,
      startDate: new Date("2021-04-13T07:35:50.691Z"),
      node: {
        type: "task",
        id: "04645e2a-0617-4007-81a7-acf11ab34938",
        data: {
          name: "Operator Names",
          view: {
            instruction:
              "Consider this section of code.\n```c\nint a = 3, b = 4, c = 5;\n\nbool x = a * b <= c;\n```\nThe expression contains an arithmetic operator, an assignment operator and a relational operator. Which is which?",
            variant: "single",
            choices: [
              {
                markdown: "```\n= Arithmetic\n* Assignment\n<= Relation\n```",
              },
              {
                markdown: "```\n* Arithmetic\n<= Assignment\n= Relation\n```",
              },
              {
                markdown: "```\n<= Arithmetic\n* Assignment\n= Relation\n```",
              },
              {
                markdown: "```\n* Arithmetic\n= Assignment\n<= Relation\n```",
              },
              {
                markdown: "```\n<= Arithmetic\n= Assignment\n* Relation\n```",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:53.087Z"),
      answer: {
        subtype: "choice",
        checked: {
          c: true,
        },
      },
      result: {
        subtype: "choice",
        state: "wrong",
        choices: {
          a: {
            state: "correct",
          },
          b: {
            state: "correct",
          },
          c: {
            state: "wrong",
          },
          d: {
            state: "wrong",
          },
          e: {
            state: "correct",
          },
          f: {
            state: "correct",
          },
          g: {
            state: "correct",
          },
          h: {
            state: "correct",
          },
        },
        allowRetry: true,
      },
    },
    {
      status: "finished",
      try: 3,
      startDate: new Date("2021-04-13T07:35:53.357Z"),
      node: {
        type: "task",
        id: "04645e2a-0617-4007-81a7-acf11ab34938",
        data: {
          name: "Operator Names",
          view: {
            instruction:
              "Consider this section of code.\n```c\nint a = 3, b = 4, c = 5;\n\nbool x = a * b <= c;\n```\nThe expression contains an arithmetic operator, an assignment operator and a relational operator. Which is which?",
            variant: "single",
            choices: [
              {
                markdown: "```\n= Arithmetic\n* Assignment\n<= Relation\n```",
              },
              {
                markdown: "```\n* Arithmetic\n<= Assignment\n= Relation\n```",
              },
              {
                markdown: "```\n<= Arithmetic\n* Assignment\n= Relation\n```",
              },
              {
                markdown: "```\n* Arithmetic\n= Assignment\n<= Relation\n```",
              },
              {
                markdown: "```\n<= Arithmetic\n= Assignment\n* Relation\n```",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:54.408Z"),
      answer: {
        subtype: "choice",
        checked: {
          d: true,
        },
      },
      result: {
        subtype: "choice",
        state: "correct",
        choices: {
          a: {
            state: "correct",
          },
          b: {
            state: "correct",
          },
          c: {
            state: "correct",
          },
          d: {
            state: "correct",
          },
          e: {
            state: "correct",
          },
          f: {
            state: "correct",
          },
          g: {
            state: "correct",
          },
          h: {
            state: "correct",
          },
        },
        allowRetry: true,
      },
    },
    {
      status: "skipped",
      try: 0,
      startDate: new Date("2021-04-13T07:35:54.721Z"),
      node: {
        type: "task",
        id: "59c7163b-f626-4e08-af43-0c62712071e2",
        data: {
          name: "Data Type for Variable",
          view: {
            instruction:
              "You see the expression `n = -250` in some C-code that successfully compiles. Of which type can `n` **not** be, if there is no overflow?",
            variant: "single",
            choices: [
              {
                markdown: "int",
              },
              {
                markdown: "float",
              },
              {
                markdown: "char",
              },
              {
                markdown: "short",
              },
              {
                markdown: "long",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:55.414Z"),
    },
    {
      status: "skipped",
      try: 0,
      startDate: new Date("2021-04-13T07:35:55.460Z"),
      node: {
        type: "task",
        id: "12ca1039-e872-4eca-b227-e21018ee555d",
        data: {
          name: "Data Type Defautl Value in C",
          view: {
            instruction:
              'What happens if the following programm gets compiled and executed?\n```c\nint main ()\n{\n\tint a, b, c;\n    int d = a + b + c;\n    printf("%d", d);\n}\n```',
            variant: "single",
            choices: [
              {
                markdown:
                  "It will not compile because `a`, `b` and `c` are not initialized.",
              },
              {
                markdown: "It will compile and output: `0`",
              },
              {
                markdown: "It will compile and output a random integer.",
              },
              {
                markdown:
                  "It will compile but give an error when trying to add `a` to `b` to `c`.",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:55.602Z"),
    },
    {
      status: "skipped",
      try: 0,
      startDate: new Date("2021-04-13T07:35:55.650Z"),
      node: {
        type: "task",
        id: "50bd2282-39cc-4d60-8cda-06585ee383d5",
        data: {
          name: "Scalar Data Types in C",
          view: {
            instruction:
              "Which of the following is **not** a scalar/primitive data type in C?",
            variant: "single",
            choices: [
              {
                markdown: "int",
              },
              {
                markdown: "float",
              },
              {
                markdown: "string",
              },
              {
                markdown: "short",
              },
              {
                markdown: "char",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:55.790Z"),
    },
    {
      status: "skipped",
      try: 0,
      startDate: new Date("2021-04-13T07:35:55.871Z"),
      node: {
        type: "task",
        id: "c5420a72-3959-491a-88de-2dafd3ed8e80",
        data: {
          name: "Simple if-else",
          view: {
            instruction:
              'What is printed out when the following code is executed?\n```c\nfloat x = 1;\nif (x > 1) {\n  printf("a");\n} else if (x > 0) {\n  printf("b");\n} else if (x > -1) {\n  printf("c");\n}\n```',
            variant: "single",
            choices: [
              {
                markdown: "a",
              },
              {
                markdown: "b",
              },
              {
                markdown: "c",
              },
              {
                markdown: "b\n\nc",
              },
              {
                markdown: "a\n\nb\n\nc",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:56.134Z"),
    },
    {
      status: "skipped",
      try: 0,
      startDate: new Date("2021-04-13T07:35:56.205Z"),
      node: {
        type: "task",
        id: "bbd56c39-d515-4f6f-9ec8-e2a761d7552a",
        data: {
          name: "for-Loop Number Sequence",
          view: {
            instruction:
              "Fill the gap in such a way that all odd numbers less than 10 and greater than zero are printed out.\n```c\nfor (##MISSING_CODE##)\n    printf(i+1);\n```",
            variant: "single",
            choices: [
              {
                markdown: "`int i = 0; i <= 10; i= i+2`",
              },
              {
                markdown: "`int i = 0; i < 10; i= i+2`",
              },
              {
                markdown: "`int i = 1; i < 10; i= i+2`",
              },
              {
                markdown: "`int i = 1; i <= 10; i= i+2`",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:56.370Z"),
    },
    {
      status: "skipped",
      try: 0,
      startDate: new Date("2021-04-13T07:35:56.417Z"),
      node: {
        type: "task",
        id: "63d34862-476c-4f09-a4c1-e8469bd444ae",
        data: {
          name: "Missing Parts of for-Loop",
          view: {
            instruction:
              "Anastasiya has written code that loops over an int array named **a** which is of length **N**. Fill in the missing part of the for loop’s declaration.\n\n```c\nint sum = 0;\nint *p;\nfor (p = a; ##MISSING_CODE##)\n{\n  sum += *p;\n}\n```",
            variant: "single",
            choices: [
              {
                markdown: "`p < N; p++`",
              },
              {
                markdown: "`p; p++`",
              },
              {
                markdown: "`p; p = p->next`",
              },
              {
                markdown: "`p->next; p = p->next`",
              },
              {
                markdown: "`p < a + N; p++`",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:56.632Z"),
    },
    {
      status: "skipped",
      try: 0,
      startDate: new Date("2021-04-13T07:35:56.693Z"),
      node: {
        type: "task",
        id: "9bbb0330-4c95-455d-ac1a-20348b032752",
        data: {
          name: "while-Loop Asterisks",
          view: {
            instruction:
              'How many asterisks will be printed as a result of executing this code?\n\n```c\nint counter = 0, N = 10;\n\nwhile (counter++ < N)\n{\n    if (counter%2 == 0)\n        continue;\n    printf("*");\n}\n```',
            variant: "single",
            choices: [
              {
                markdown: "none, infinite loop",
              },
              {
                markdown: "10",
              },
              {
                markdown: "5",
              },
              {
                markdown: "1",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:56.865Z"),
    },
    {
      status: "skipped",
      try: 0,
      startDate: new Date("2021-04-13T07:35:56.907Z"),
      node: {
        type: "task",
        id: "ceb05fff-ee4e-4aaf-bfa2-dfd060f87fac",
        data: {
          name: "Array Properties",
          view: {
            instruction:
              "Which data structure provides direct access to elements using indexes in constant time?",
            variant: "single",
            choices: [
              {
                markdown: "Array",
              },
              {
                markdown: "Linked List",
              },
              {
                markdown: "Binary Tree",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:57.015Z"),
    },
    {
      status: "skipped",
      try: 0,
      startDate: new Date("2021-04-13T07:35:57.048Z"),
      node: {
        type: "task",
        id: "1848d78b-ce2a-4eaf-961a-141885df17af",
        data: {
          name: "Use-Case for Linked List",
          view: {
            instruction:
              "You do not know exactly how much data you need to store, but there's not much of it. You would like to not allocate any memory that won't be used. You do not need to be able to search the collection quickly. What is the simplest data structure best suited for your needs?",
            variant: "single",
            choices: [
              {
                markdown: "Unordered Array",
              },
              {
                markdown: "Ordered Array",
              },
              {
                markdown: "Linked List",
              },
              {
                markdown: "Hashtable",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:57.160Z"),
    },
    {
      status: "skipped",
      try: 0,
      startDate: new Date("2021-04-13T07:35:57.198Z"),
      node: {
        type: "task",
        id: "70045660-5ce5-4aee-8595-21e138cfd125",
        data: {
          name: "Procedures Static in C",
          view: {
            instruction:
              "Which of the follwing statements are true for procedures in C?",
            variant: "multiple",
            choices: [
              {
                markdown: "A procedure has at least one parameter.",
              },
              {
                markdown:
                  "Each parameter of a procedure must have the same type.",
              },
              {
                markdown: "A procedure has a name.",
              },
              {
                markdown: "A procedure can only be called once.",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:57.300Z"),
    },
    {
      status: "skipped",
      try: 0,
      startDate: new Date("2021-04-13T07:35:57.329Z"),
      node: {
        type: "task",
        id: "a1c691b3-9395-419d-b79f-f8df2a791f6c",
        data: {
          name: "Procedures Dynamic in C",
          view: {
            instruction:
              "Which of the following assertions about procedures are correct?",
            variant: "multiple",
            choices: [
              {
                markdown:
                  "The body of a procedure must contain at least one return statement.",
              },
              {
                markdown: "A procedure must return a value.",
              },
              {
                markdown:
                  "A procedure invocation/call must contain at least one argument.",
              },
              {
                markdown:
                  "A procedure with no return statement must not be invoked on the right side of an assignment statement.",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:57.484Z"),
    },
    {
      status: "skipped",
      try: 0,
      startDate: new Date("2021-04-13T07:35:57.560Z"),
      node: {
        type: "task",
        id: "52584b2b-608e-44ae-995b-35e086ade0d9",
        data: {
          name: "Scanf Integer in C",
          view: {
            instruction:
              "Which of the following lines of code will correctly read in the integer value foo?",
            variant: "single",
            choices: [
              {
                markdown: '`scanf("%d", &foo);`',
              },
              {
                markdown: '`scanf("%f", foo);`',
              },
              {
                markdown: '`scanf("%f", &foo);`',
              },
              {
                markdown: '`scanf("%f\\n", foo);`',
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:57.698Z"),
    },
    {
      status: "skipped",
      try: 0,
      startDate: new Date("2021-04-13T07:35:57.740Z"),
      node: {
        type: "task",
        id: "dab5c2bb-1c40-4ee2-84d3-980378f42b08",
        data: {
          name: "Pointer in C",
          view: {
            instruction:
              'Consider the code\n\n```c\nint i, *q, *p;\n\np = &i;\nq = p;\n*p = 5;\n```\n\nWhich of the following will print out "The value is 5."?',
            variant: "single",
            choices: [
              {
                markdown: '`printf("The value is %d", &i);`',
              },
              {
                markdown: '`printf("The value is %d", p);`',
              },
              {
                markdown: '`printf("The value is %d", *q);`',
              },
              {
                markdown: '`printf("The value is %d", *i);`',
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:57.923Z"),
    },
    {
      status: "skipped",
      try: 0,
      startDate: new Date("2021-04-13T07:35:57.969Z"),
      node: {
        type: "task",
        id: "8ef094f8-760f-4e8d-8374-896510f10f1f",
        data: {
          name: "Pointer Memory Footprint in C",
          view: {
            instruction:
              "What is the difference between the following two code snippets written in C?\n\nA\n```c\nstruct node* linked_list_node = malloc(sizeof(struct node));\n\nlinked_list_node->val = 3;\nlinked_list_node->next = NULL;\n```\n \nB\n```c\nstruct node linked_list_node;\n\nlinked_list_node.val = 3;\nlinked_list_node.next = NULL;\n```",
            variant: "single",
            choices: [
              {
                markdown: "The first needs more memory than the second",
              },
              {
                markdown:
                  "The first’s node is stored on the heap; the second’s is stored on the stack",
              },
              {
                markdown:
                  "The second is globally-accessible in the program; the first is locally accessible",
              },
              {
                markdown: "There is no difference",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
              {
                markdown: "",
              },
            ],
          },
          subtype: "choice",
        },
      },
      endDate: new Date("2021-04-13T07:35:58.150Z"),
    },
    {
      status: "skipped",
      try: 0,
      startDate: new Date("2021-04-13T07:35:58.204Z"),
      node: {
        type: "task",
        id: "2b71c016-7dbb-4b0d-81cc-1d07d332f595",
        data: {
          name: "Feedback",
          view: {
            instruction:
              "Feel free to write me some feedback on the assessment over here.",
          },
          subtype: "input",
        },
      },
      endDate: new Date("2021-04-13T07:35:58.268Z"),
    },
  ],
});
