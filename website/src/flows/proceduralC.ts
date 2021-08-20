import { Flow } from "@bitflow/core";

export const proceduralC: Flow = {
  name: "Procedural Programming in C",
  description: "",
  language: "en",
  visibility: "public",
  draft: false,
  nodes: [
    {
      id: "1a32d231-d47c-4b6a-856e-4ba277257161",
      position: { x: -45.00000000000001, y: -104 },
      type: "start",
      data: {
        name: "Start",
        description: "",
        subtype: "simple",
        view: {
          title: "Start",
          markdown:
            '# Welcome to this assessment\n\nThis assessment is meant to evaluate how much you already know about some topics of the course "Procedural Programming in C". \n\nYou do not need to answer anything correctly to be able to attent the course. You can attend the course no matter how many questions you answer right or wrong. You will learn something about Programming and C in the course.\n\nThe results will help lecturers to understand your and your fellow students\' previous knowledge. The gathered information can be used to adapt the course to your needs.\n\nThis assessment is part of a PhD Project. By doing the assessment you agree that your data can be used for this project. No personal data will be collected.\n\nIf you want to know more about the project you can write me an e-mail: [mike.barkmin@uni-due.de](mailto:mike.barkmin@uni-de.de)',
        },
      },
    },
    {
      id: "1c1b736f-7f56-4504-b424-a201307918d7",
      position: { x: 2271, y: 191 },
      type: "end",
      data: {
        name: "End",
        description: "",
        subtype: "tries",
        view: {
          markdown:
            "# Thanks for your participation!\n\nI hope you got something out of the assessment.\n\nIf you are interested in doing more assessments like this or if you want to know more about the project you can write me an e-mail: [mike.barkmin@uni-due.de](mailto:mike.barkmin@uni-due.de)",
        },
      },
    },
    {
      id: "45a2e52f-7ef9-468d-a377-1b09ded7179e",
      position: { x: 336, y: -117.5 },
      type: "task",
      data: {
        name: "Definition Algorithm",
        description: "CQB ID 634953",
        subtype: "choice",
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
              markdown: "A well-ordered collection of unambiguous statements.",
            },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
          ],
        },
        evaluation: {
          mode: "auto",
          enableRetry: true,
          showFeedback: true,
          correct: ["b"],
        },
        feedback: {
          patterns: {},
          choices: {
            a: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            b: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: {
                message:
                  "This provides the best definition. A key component is that in order to be an algorithm, it must eventually halt.",
                severity: "error",
              },
            },
            c: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            d: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            e: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
          },
        },
      },
    },
    {
      id: "12ca1039-e872-4eca-b227-e21018ee555d",
      position: { x: 575, y: 132.1999969482422 },
      type: "task",
      data: {
        name: "Data Type Defautl Value in C",
        description: "Custom",
        subtype: "choice",
        view: {
          instruction:
            'What happens if the following programm gets compiled and executed?\n```c\nint main ()\n{\n\tint a, b, c;\n    int d = a + b + c;\n    printf("%d", d);\n}\n```',
          variant: "single",
          choices: [
            {
              markdown:
                "It will not compile because `a`, `b` and `c` are not initialized.",
            },
            { markdown: "It will compile and output: `0`" },
            { markdown: "It will compile and output a random integer." },
            {
              markdown:
                "It will compile but give an error when trying to add `a` to `b` to `c`.",
            },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
          ],
        },
        evaluation: {
          mode: "auto",
          enableRetry: true,
          showFeedback: true,
          correct: ["c"],
        },
        feedback: {
          patterns: {},
          choices: {
            b: {
              checkedFeedback: {
                message:
                  "If a variable of type `int` is declared but not initialized, it will hold an undefined value. Thus, we can not be sure what the output will be.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            a: {
              checkedFeedback: {
                message:
                  "If a variable of type `int` is declared but not initialized, it will hold an undefined value. But this will not lead to an error at compile time.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            c: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            d: {
              checkedFeedback: {
                message:
                  "If a variable of type `int` is declared but not initialized, it will hold an undefined value. Thus, the addition is valid and will not result in an error.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            e: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
          },
        },
      },
    },
    {
      id: "52584b2b-608e-44ae-995b-35e086ade0d9",
      position: { x: 245, y: 694.1999969482422 },
      type: "task",
      data: {
        name: "Scanf Integer in C",
        description: "CQB 633255",
        subtype: "choice",
        view: {
          instruction:
            "Which of the following lines of code will correctly read in the integer value foo?",
          variant: "single",
          choices: [
            { markdown: '`scanf("%d", &foo);`' },
            { markdown: '`scanf("%f", foo);`' },
            { markdown: '`scanf("%f", &foo);`' },
            { markdown: '`scanf("%f\\n", foo);`' },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
          ],
        },
        evaluation: {
          mode: "auto",
          enableRetry: true,
          showFeedback: true,
          correct: ["a"],
        },
        feedback: {
          patterns: {},
          choices: {
            a: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            d: {
              checkedFeedback: {
                message:
                  "The \\n is unnecessary. Also, scanf requires a pointer to a variable's address.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            b: {
              checkedFeedback: {
                message: "Scanf requires a pointer to a variable's address.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            c: {
              checkedFeedback: {
                message: "%f is used for reading in floats, not integers.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
          },
        },
      },
    },
    {
      id: "70045660-5ce5-4aee-8595-21e138cfd125",
      position: { x: 235.26302428337067, y: 547.4285257324648 },
      type: "task",
      data: {
        name: "Procedures Static in C",
        description: "Custom",
        subtype: "choice",
        view: {
          instruction:
            "Which of the follwing statements are true for procedures in C?",
          variant: "multiple",
          choices: [
            { markdown: "A procedure has at least one parameter." },
            {
              markdown:
                "Each parameter of a procedure must have the same type.",
            },
            { markdown: "A procedure has a name." },
            { markdown: "A procedure can only be called once." },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
          ],
        },
        evaluation: {
          mode: "auto",
          enableRetry: true,
          showFeedback: true,
          correct: ["c"],
        },
        feedback: {
          patterns: {},
          choices: {
            a: {
              checkedFeedback: {
                message: "A procedure can have zero parameters.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            b: {
              checkedFeedback: {
                message:
                  "The parameter of a procedure can have different types.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            c: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: {
                message:
                  "Same programming languages support anonymous procedures, C does not.",
                severity: "error",
              },
            },
            d: {
              checkedFeedback: {
                message:
                  "A procedure can be called as often as it is required.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
          },
        },
      },
    },
    {
      id: "a1c691b3-9395-419d-b79f-f8df2a791f6c",
      position: { x: 718.2630242833707, y: 532.4285257324649 },
      type: "task",
      data: {
        name: "Procedures Dynamic in C",
        description: "CQB ID 631999",
        subtype: "choice",
        view: {
          instruction:
            "Which of the following assertions about procedures are correct?",
          variant: "multiple",
          choices: [
            {
              markdown:
                "The body of a procedure must contain at least one return statement.",
            },
            { markdown: "A procedure must return a value." },
            {
              markdown:
                "A procedure invocation/call must contain at least one argument.",
            },
            {
              markdown:
                "A procedure with no return statement must not be invoked on the right side of an assignment statement.",
            },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
          ],
        },
        evaluation: {
          mode: "auto",
          enableRetry: true,
          showFeedback: true,
          correct: ["d"],
        },
        feedback: {
          patterns: {},
          choices: {
            a: {
              checkedFeedback: {
                message:
                  "If the return type of a procedure is void, it does not need a return statement.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            b: {
              checkedFeedback: {
                message:
                  "If the return type of a procedure is void, it does not need a return statement.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            c: {
              checkedFeedback: {
                message:
                  "A procedure invocation/call in C must have as many arguments as the procedure has parameters.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            d: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
          },
        },
      },
    },
    {
      id: "14abdd58-5a56-4132-ba40-def3fac4deb0",
      position: { x: 306.26302428337067, y: 2.4285257324647773 },
      type: "task",
      data: {
        name: "Bool Expression",
        description: "CQB ID 632844",
        subtype: "choice",
        view: {
          instruction:
            "After the assignments `a = true` and `b = true`, what is returned by `(not a or b) and (a or not b)`?",
          variant: "single",
          choices: [
            { markdown: "true" },
            { markdown: "false" },
            { markdown: "an error" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
          ],
        },
        evaluation: {
          mode: "auto",
          enableRetry: true,
          showFeedback: true,
          correct: ["a"],
        },
        feedback: {
          patterns: {},
          choices: {
            b: {
              checkedFeedback: {
                message:
                  "the not operator has a higher precedence than or, so this expression should be read:\n\n`((not a) or b) and (a or (not b))`",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            a: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            c: {
              checkedFeedback: {
                message:
                  "The expression is valid and will not return an error.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            d: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            e: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
          },
        },
      },
    },
    {
      id: "63d34862-476c-4f09-a4c1-e8469bd444ae",
      position: { x: 751.2630242833707, y: 265.4285257324648 },
      type: "task",
      data: {
        name: "Missing Parts of for-Loop",
        description: "CQB ID 634989",
        subtype: "choice",
        view: {
          instruction:
            "Anastasiya has written code that loops over an int array named **a** which is of length **N**. Fill in the missing part of the for loop’s declaration.\n\n```c\nint sum = 0;\nint *p;\nfor (p = a; ##MISSING_CODE##)\n{\n  sum += *p;\n}\n```",
          variant: "single",
          choices: [
            { markdown: "`p < N; p++`" },
            { markdown: "`p; p++`" },
            { markdown: "`p; p = p->next`" },
            { markdown: "`p->next; p = p->next`" },
            { markdown: "`p < a + N; p++`" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
          ],
        },
        evaluation: {
          mode: "auto",
          enableRetry: true,
          showFeedback: true,
          correct: ["e"],
        },
        feedback: {
          patterns: {},
          choices: {
            a: {
              checkedFeedback: {
                message:
                  "N is not an appropriate ending condition as it needs to be relative from where you started",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            b: {
              checkedFeedback: {
                message:
                  "p will not work as the ending condition as you don't know what's at the end of the array",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            c: {
              checkedFeedback: {
                message:
                  "p will not work as the ending condition as you don't know what's at the end of the array",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            d: {
              checkedFeedback: {
                message: "`p->next` is not a valid ending condition.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            e: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
          },
        },
      },
    },
    {
      id: "bbd56c39-d515-4f6f-9ec8-e2a761d7552a",
      position: { x: 392.26302428337067, y: 263.4285257324649 },
      type: "task",
      data: {
        name: "for-Loop Number Sequence",
        description: "CQB ID 618978",
        subtype: "choice",
        view: {
          instruction:
            "Fill the gap in such a way that all odd numbers less than 10 and greater than zero are printed out.\n```c\nfor (##MISSING_CODE##)\n    printf(i+1);\n```",
          variant: "single",
          choices: [
            { markdown: "`int i = 0; i <= 10; i= i+2`" },
            { markdown: "`int i = 0; i < 10; i= i+2`" },
            { markdown: "`int i = 1; i < 10; i= i+2`" },
            { markdown: "`int i = 1; i <= 10; i= i+2`" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
          ],
        },
        evaluation: {
          mode: "auto",
          enableRetry: true,
          showFeedback: true,
          correct: ["b"],
        },
        feedback: {
          patterns: {},
          choices: {
            a: {
              checkedFeedback: {
                message: "This will include 10.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            c: {
              checkedFeedback: {
                message:
                  "This will print all even numbers less than 10 and greater than zero.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            d: {
              checkedFeedback: {
                message:
                  "This will print all even numbers greater than zero up to and including 10.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            b: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
          },
        },
      },
    },
    {
      id: "9bbb0330-4c95-455d-ac1a-20348b032752",
      position: { x: 1048.2630242833707, y: 245.42852573246478 },
      type: "task",
      data: {
        name: "while-Loop Asterisks",
        description: "CQB 618985",
        subtype: "choice",
        view: {
          instruction:
            'How many asterisks will be printed as a result of executing this code?\n\n```c\nint counter = 0, N = 10;\n\nwhile (counter++ < N)\n{\n    if (counter%2 == 0)\n        continue;\n    printf("*");\n}\n```',
          variant: "single",
          choices: [
            { markdown: "none, infinite loop" },
            { markdown: "10" },
            { markdown: "5" },
            { markdown: "1" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
          ],
        },
        evaluation: {
          mode: "auto",
          enableRetry: true,
          showFeedback: true,
          correct: ["c"],
        },
        feedback: {
          patterns: {},
          choices: {
            a: {
              checkedFeedback: {
                message:
                  "`counter` is increased in every after every interation. The while loop is also bounded by `N`. Therefore, the while loop will stop when `counter` reaches `N`.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            b: {
              checkedFeedback: {
                message:
                  "The if-Statement and continue-Statement ensure that an asteriks is printed only when the value of `counter` is odd.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            d: {
              checkedFeedback: {
                message:
                  "`continue` only skips the current interation. If `continue` was replaced by `break` this answer would be correct.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            c: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
          },
        },
      },
    },
    {
      id: "c5420a72-3959-491a-88de-2dafd3ed8e80",
      position: { x: 197.26302428337067, y: 254.4285257324649 },
      type: "task",
      data: {
        name: "Simple if-else",
        description: "Custom",
        subtype: "choice",
        view: {
          instruction:
            'What is printed out when the following code is executed?\n```c\nfloat x = 1;\nif (x > 1) {\n  printf("a");\n} else if (x > 0) {\n  printf("b");\n} else if (x > -1) {\n  printf("c");\n}\n```',
          variant: "single",
          choices: [
            { markdown: "a" },
            { markdown: "b" },
            { markdown: "c" },
            { markdown: "b\n\nc" },
            { markdown: "a\n\nb\n\nc" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
          ],
        },
        evaluation: {
          mode: "auto",
          enableRetry: true,
          showFeedback: true,
          correct: ["b"],
        },
        feedback: {
          patterns: {},
          choices: {
            a: {
              checkedFeedback: {
                message: "The expression `x > 1` is not true for `x == 1`.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            b: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            c: {
              checkedFeedback: {
                message:
                  "The expression `x > -1` is true for `x == 1`, but this case is not reached since the previous one `x > 0` is also true.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            d: {
              checkedFeedback: {
                message:
                  "If in an if-else-Statement a true expression is reached, following cases will not be evaluated anymore.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            e: {
              checkedFeedback: {
                message:
                  "If in an if-else-Statement a true expression is reached, following cases will not be evaluated anymore.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
          },
        },
      },
    },
    {
      id: "04645e2a-0617-4007-81a7-acf11ab34938",
      position: { x: 629.2630242833707, y: 8.428525732464834 },
      type: "task",
      data: {
        name: "Operator Names",
        description: "CQB 632064",
        subtype: "choice",
        view: {
          instruction:
            "Consider this section of code.\n```c\nint a = 3, b = 4, c = 5;\n\nbool x = a * b <= c;\n```\nThe expression contains an arithmetic operator, an assignment operator and a relational operator. Which is which?",
          variant: "single",
          choices: [
            { markdown: "```\n= Arithmetic\n* Assignment\n<= Relation\n```" },
            { markdown: "```\n* Arithmetic\n<= Assignment\n= Relation\n```" },
            { markdown: "```\n<= Arithmetic\n* Assignment\n= Relation\n```" },
            { markdown: "```\n* Arithmetic\n= Assignment\n<= Relation\n```" },
            { markdown: "```\n<= Arithmetic\n= Assignment\n* Relation\n```" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
          ],
        },
        evaluation: {
          mode: "auto",
          enableRetry: true,
          showFeedback: true,
          correct: ["d"],
        },
        feedback: {
          patterns: {},
          choices: {
            d: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            a: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            b: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            c: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            e: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
          },
        },
      },
    },
    {
      id: "50bd2282-39cc-4d60-8cda-06585ee383d5",
      position: { x: 992.2630242833706, y: 84.42852573246483 },
      type: "task",
      data: {
        name: "Scalar Data Types in C",
        description: "CQB 632094",
        subtype: "choice",
        view: {
          instruction:
            "Which of the following is **not** a scalar/primitive data type in C?",
          variant: "single",
          choices: [
            { markdown: "int" },
            { markdown: "float" },
            { markdown: "string" },
            { markdown: "short" },
            { markdown: "char" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
          ],
        },
        evaluation: {
          mode: "auto",
          enableRetry: true,
          showFeedback: true,
          correct: ["c"],
        },
        feedback: {
          patterns: {},
          choices: {
            c: {
              checkedFeedback: {
                message:
                  "A String is not a scalar/primitive data type. It can be thought of as an array of characters.",
                severity: "success",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            a: {
              checkedFeedback: {
                message: "int is a scalar data type",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            b: {
              checkedFeedback: {
                message: "float is a scalar data type",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            d: {
              checkedFeedback: {
                message: "short is a scalar data type",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            e: {
              checkedFeedback: {
                message: "char is a scalar data type",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
          },
        },
      },
    },
    {
      id: "59c7163b-f626-4e08-af43-0c62712071e2",
      position: { x: 274.26302428337067, y: 121.42852573246478 },
      type: "task",
      data: {
        name: "Data Type for Variable",
        description: "CQB 633401",
        subtype: "choice",
        view: {
          instruction:
            "You see the expression `n = -250` in some C-code that successfully compiles. Of which type can `n` **not** be, if there is no overflow?",
          variant: "single",
          choices: [
            { markdown: "int" },
            { markdown: "float" },
            { markdown: "char" },
            { markdown: "short" },
            { markdown: "long" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
          ],
        },
        evaluation: {
          mode: "auto",
          enableRetry: true,
          showFeedback: true,
          correct: ["c"],
        },
        feedback: {
          patterns: {},
          choices: {
            a: {
              checkedFeedback: {
                message:
                  "int is capable of containing at least values in the range of [-32,767, +32,767]",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            b: {
              checkedFeedback: {
                message: "float is capable of containing large numbers",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            c: {
              checkedFeedback: {
                message:
                  "char is capable of containing at least values in the range of [-128, +127]",
                severity: "success",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            d: {
              checkedFeedback: {
                message:
                  "short is capable of containing at least values in the range of [-32768, +32767]",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            e: {
              checkedFeedback: {
                message: "long is capable of containing large numbers",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
          },
        },
      },
    },
    {
      id: "8ef094f8-760f-4e8d-8374-896510f10f1f",
      position: { x: 885.2630242833707, y: 693.4285257324648 },
      type: "task",
      data: {
        name: "Pointer Memory Footprint in C",
        description: "CQB ID 634942",
        subtype: "choice",
        view: {
          instruction:
            "What is the difference between the following two code snippets written in C?\n\nA\n```c\nstruct node* linked_list_node = malloc(sizeof(struct node));\n\nlinked_list_node->val = 3;\nlinked_list_node->next = NULL;\n```\n \nB\n```c\nstruct node linked_list_node;\n\nlinked_list_node.val = 3;\nlinked_list_node.next = NULL;\n```",
          variant: "single",
          choices: [
            { markdown: "The first needs more memory than the second" },
            {
              markdown:
                "The first’s node is stored on the heap; the second’s is stored on the stack",
            },
            {
              markdown:
                "The second is globally-accessible in the program; the first is locally accessible",
            },
            { markdown: "There is no difference" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
          ],
        },
        evaluation: {
          mode: "auto",
          enableRetry: true,
          showFeedback: true,
          correct: ["b"],
        },
        feedback: {
          patterns: {},
          choices: {
            a: {
              checkedFeedback: {
                message: "Both need the same amount of memory.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            c: {
              checkedFeedback: {
                message: "Both are accessible in the same scope.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            d: {
              checkedFeedback: {
                message: "Dynamic alloc goes on heap; static goes on stack.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
          },
        },
      },
    },
    {
      id: "dab5c2bb-1c40-4ee2-84d3-980378f42b08",
      position: { x: 602.2630242833707, y: 697.4285257324648 },
      type: "task",
      data: {
        name: "Pointer in C",
        description: "CQB ID 634143",
        subtype: "choice",
        view: {
          instruction:
            'Consider the code\n\n```c\nint i, *q, *p;\n\np = &i;\nq = p;\n*p = 5;\n```\n\nWhich of the following will print out "The value is 5."?',
          variant: "single",
          choices: [
            { markdown: '`printf("The value is %d", &i);`' },
            { markdown: '`printf("The value is %d", p);`' },
            { markdown: '`printf("The value is %d", *q);`' },
            { markdown: '`printf("The value is %d", *i);`' },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
          ],
        },
        evaluation: {
          mode: "auto",
          enableRetry: true,
          showFeedback: true,
          correct: ["c"],
        },
        feedback: {
          patterns: {},
          choices: {
            a: {
              checkedFeedback: {
                message: "&i will return the memory address of the variable i.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            b: {
              checkedFeedback: {
                message: "p contains the memory address of the variable i.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            d: {
              checkedFeedback: {
                message:
                  "*i is an invalid expression, because the * operator does not work on int.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
          },
        },
      },
    },
    {
      id: "1848d78b-ce2a-4eaf-961a-141885df17af",
      position: { x: 668.2630242833707, y: 395.42852573246483 },
      type: "task",
      data: {
        name: "Use-Case for Linked List",
        description: "CQB ID 634951",
        subtype: "choice",
        view: {
          instruction:
            "You do not know exactly how much data you need to store, but there's not much of it. You would like to not allocate any memory that won't be used. You do not need to be able to search the collection quickly. What is the simplest data structure best suited for your needs?",
          variant: "single",
          choices: [
            { markdown: "Unordered Array" },
            { markdown: "Ordered Array" },
            { markdown: "Linked List" },
            { markdown: "Hashtable" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
          ],
        },
        evaluation: {
          mode: "auto",
          enableRetry: true,
          showFeedback: true,
          correct: ["c"],
        },
        feedback: {
          patterns: {},
          choices: {
            a: {
              checkedFeedback: {
                message:
                  "Since arrays must be allocated before they are used, we tend to overallocate to make sure we have sufficient capacity.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            b: {
              checkedFeedback: {
                message:
                  "Since arrays must be allocated before they are used, we tend to overallocate to make sure we have sufficient capacity.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            c: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            d: {
              checkedFeedback: {
                message: "Hashtables can not be searched easily.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            e: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
          },
        },
      },
    },
    {
      id: "ceb05fff-ee4e-4aaf-bfa2-dfd060f87fac",
      position: { x: 246.26302428337067, y: 402.4285257324648 },
      type: "task",
      data: {
        name: "Array Properties",
        description: "CQB ID 632268",
        subtype: "choice",
        view: {
          instruction:
            "Which data structure provides direct access to elements using indexes in constant time?",
          variant: "single",
          choices: [
            { markdown: "Array" },
            { markdown: "Linked List" },
            { markdown: "Binary Tree" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
            { markdown: "" },
          ],
        },
        evaluation: {
          mode: "auto",
          enableRetry: true,
          showFeedback: true,
          correct: ["a"],
        },
        feedback: {
          patterns: {},
          choices: {
            a: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            b: {
              checkedFeedback: {
                message:
                  "To access an element of a linked list, the list must be traversed in linear time.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            c: {
              checkedFeedback: {
                message:
                  "To access an element of a binary tree, the binary tree must be traversed in logarithmic time.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            d: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
          },
        },
      },
    },
    {
      id: "2b71c016-7dbb-4b0d-81cc-1d07d332f595",
      position: { x: 2038.2630242833707, y: 185.42852573246478 },
      type: "task",
      data: {
        name: "Feedback",
        description: "",
        subtype: "input",
        view: {
          instruction:
            "Feel free to write me some feedback on the assessment over here.",
        },
        evaluation: {
          mode: "skip",
          enableRetry: false,
          showFeedback: false,
          pattern: "",
        },
        feedback: { patterns: [] },
      },
    },
    {
      id: "aecc553e-6a3a-4eab-9b3a-60e53a149069",
      position: { x: 1445.2630242833707, y: -127.57147426753522 },
      type: "portal-input",
      data: { portal: "Expressions and Operators", description: "" },
    },
    {
      id: "5e1d3242-c330-4f3f-b432-55c4ad2c69f5",
      position: { x: -22.73697571662933, y: 130.42852573246478 },
      type: "portal-output",
      data: { portal: "Data Types", description: "" },
    },
    {
      id: "563c5737-679a-4ff2-ae83-89d442fe5d4c",
      position: { x: 1487.2630242833707, y: -15.571474267535223 },
      type: "portal-input",
      data: { portal: "Data Types", description: "" },
    },
    {
      id: "405c373c-8faf-4b37-96a6-c110470f1e92",
      position: { x: 1495.2630242833707, y: 344.4285257324648 },
      type: "portal-input",
      data: { portal: "Procedures", description: "" },
    },
    {
      id: "5eeb11a2-37c1-4d9a-adee-b23bbea673d4",
      position: { x: 1504.2630242833707, y: 101.42852573246479 },
      type: "portal-input",
      data: { portal: "Control", description: "" },
    },
    {
      id: "f3c88f14-d9aa-4dee-8dbb-776db7757fce",
      position: { x: 1477.2630242833707, y: 224.42852573246478 },
      type: "portal-input",
      data: { portal: "Data Structures", description: "" },
    },
    {
      id: "32e1d9e6-879f-4c94-969f-2a140d628b1c",
      position: { x: 1444.1008128838396, y: 471.98596222705146 },
      type: "portal-input",
      data: { portal: "Pointers and Stdio", description: "" },
    },
    {
      id: "07a30332-6c4f-47db-b4dd-a410e7605875",
      position: { x: -78.68086896522777, y: 16.0559150795616 },
      type: "portal-output",
      data: { portal: "Expressions and Operators", description: "" },
    },
    {
      id: "27346d17-df0e-48b8-93d9-25432b6a929f",
      position: { x: -29.43623323266945, y: 260.7115323491753 },
      type: "portal-output",
      data: { portal: "Control", description: "" },
    },
    {
      id: "96fe482d-15de-47dd-b66d-7cbf4fc16cd6",
      position: { x: -30.220371667064484, y: 412.14894982890564 },
      type: "portal-output",
      data: { portal: "Data Structures", description: "" },
    },
    {
      id: "c06d0c2e-534f-49ee-9040-07f49f160e06",
      position: { x: -22.145740287596553, y: 532.3544405974333 },
      type: "portal-output",
      data: { portal: "Procedures", description: "" },
    },
    {
      id: "0166fe65-3b1f-46b2-9429-d8b7d5ba691a",
      position: { x: -22.27090532813591, y: 710.9066523206258 },
      type: "portal-output",
      data: { portal: "Pointers and Stdio", description: "" },
    },
    {
      id: "d69b0f03-335f-494c-badb-69158270c32b",
      position: { x: 1476.5417048488612, y: 665.1385790318284 },
      type: "portal-input",
      data: { portal: "Feedback", description: "" },
    },
    {
      id: "723aae76-e15e-4bd2-819e-7f3e392ea4ea",
      position: { x: 1770.4647352451148, y: 189.49567078357035 },
      type: "portal-output",
      data: { portal: "Feedback", description: "" },
    },
  ],
  edges: [
    {
      id: "94899c84-4c7b-4046-9526-0047ead21b9d",
      source: "1a32d231-d47c-4b6a-856e-4ba277257161",
      sourceHandle: "a",
      target: "45a2e52f-7ef9-468d-a377-1b09ded7179e",
    },
    {
      id: "63107060-3031-4794-8317-50afd906cba4",
      source: "14abdd58-5a56-4132-ba40-def3fac4deb0",
      sourceHandle: "a",
      target: "04645e2a-0617-4007-81a7-acf11ab34938",
    },
    {
      id: "4c1ea7e0-b59f-41bf-ac67-a6468879307c",
      source: "bbd56c39-d515-4f6f-9ec8-e2a761d7552a",
      sourceHandle: "a",
      target: "63d34862-476c-4f09-a4c1-e8469bd444ae",
    },
    {
      id: "0cf5ca0e-2a6f-42f7-86e1-932f663cd3a3",
      source: "63d34862-476c-4f09-a4c1-e8469bd444ae",
      sourceHandle: "a",
      target: "9bbb0330-4c95-455d-ac1a-20348b032752",
    },
    {
      id: "12ac6f6b-2cba-484a-8a71-4bc90fff2303",
      source: "59c7163b-f626-4e08-af43-0c62712071e2",
      sourceHandle: "a",
      target: "12ca1039-e872-4eca-b227-e21018ee555d",
    },
    {
      id: "617557e3-9a53-4fc3-a0e4-c8e8ab5ff8b3",
      source: "ceb05fff-ee4e-4aaf-bfa2-dfd060f87fac",
      sourceHandle: "a",
      target: "1848d78b-ce2a-4eaf-961a-141885df17af",
    },
    {
      id: "dedfca2b-73a2-4a7d-b1ec-6c34ca337c2e",
      source: "12ca1039-e872-4eca-b227-e21018ee555d",
      sourceHandle: "a",
      target: "50bd2282-39cc-4d60-8cda-06585ee383d5",
    },
    {
      id: "ca7e895a-9f3f-464b-8cdd-6ec75901e817",
      source: "52584b2b-608e-44ae-995b-35e086ade0d9",
      sourceHandle: "a",
      target: "dab5c2bb-1c40-4ee2-84d3-980378f42b08",
    },
    {
      id: "226e414e-b956-463d-be2f-358abb90281e",
      source: "dab5c2bb-1c40-4ee2-84d3-980378f42b08",
      sourceHandle: "a",
      target: "8ef094f8-760f-4e8d-8374-896510f10f1f",
    },
    {
      id: "10dd829c-ffd9-4711-937a-3f938f12b7d5",
      source: "2b71c016-7dbb-4b0d-81cc-1d07d332f595",
      sourceHandle: "a",
      target: "1c1b736f-7f56-4504-b424-a201307918d7",
    },
    {
      id: "bcb8f9ef-8fe7-4cab-a9fe-f434acbb3de7",
      source: "45a2e52f-7ef9-468d-a377-1b09ded7179e",
      sourceHandle: "a",
      target: "aecc553e-6a3a-4eab-9b3a-60e53a149069",
    },
    {
      id: "fc43db6e-4fa6-4955-a3bf-19159653424a",
      source: "07a30332-6c4f-47db-b4dd-a410e7605875",
      sourceHandle: "a",
      target: "14abdd58-5a56-4132-ba40-def3fac4deb0",
    },
    {
      id: "19d4cbb3-7d24-4464-9095-5a79136318bc",
      source: "04645e2a-0617-4007-81a7-acf11ab34938",
      sourceHandle: "a",
      target: "563c5737-679a-4ff2-ae83-89d442fe5d4c",
    },
    {
      id: "c79ca785-c3f8-4b07-a77e-38a73b6415ac",
      source: "5e1d3242-c330-4f3f-b432-55c4ad2c69f5",
      sourceHandle: "a",
      target: "59c7163b-f626-4e08-af43-0c62712071e2",
    },
    {
      id: "f2246909-b108-4523-bd64-949f33ac7a5f",
      source: "50bd2282-39cc-4d60-8cda-06585ee383d5",
      sourceHandle: "a",
      target: "5eeb11a2-37c1-4d9a-adee-b23bbea673d4",
    },
    {
      id: "aa9f120e-ca18-49ee-b53d-bb9e963a3ffb",
      source: "27346d17-df0e-48b8-93d9-25432b6a929f",
      sourceHandle: "a",
      target: "c5420a72-3959-491a-88de-2dafd3ed8e80",
    },
    {
      id: "a291eb02-b86e-42bd-bf97-df3cbc42e6e2",
      source: "c5420a72-3959-491a-88de-2dafd3ed8e80",
      sourceHandle: "a",
      target: "bbd56c39-d515-4f6f-9ec8-e2a761d7552a",
    },
    {
      id: "fbee6271-c7cc-4737-87c6-57f6407db0ea",
      source: "9bbb0330-4c95-455d-ac1a-20348b032752",
      sourceHandle: "a",
      target: "f3c88f14-d9aa-4dee-8dbb-776db7757fce",
    },
    {
      id: "a397655a-ccc7-4f1b-ad39-b0794e545d95",
      source: "96fe482d-15de-47dd-b66d-7cbf4fc16cd6",
      sourceHandle: "a",
      target: "ceb05fff-ee4e-4aaf-bfa2-dfd060f87fac",
    },
    {
      id: "ca241961-8e73-4825-b336-1c5e44b59bba",
      source: "1848d78b-ce2a-4eaf-961a-141885df17af",
      sourceHandle: "a",
      target: "405c373c-8faf-4b37-96a6-c110470f1e92",
    },
    {
      id: "ba19c4de-a835-4055-a52e-ccfc44db0cbd",
      source: "c06d0c2e-534f-49ee-9040-07f49f160e06",
      sourceHandle: "a",
      target: "70045660-5ce5-4aee-8595-21e138cfd125",
    },
    {
      id: "00596b9c-befc-44bd-beaa-daec14536c3e",
      source: "70045660-5ce5-4aee-8595-21e138cfd125",
      sourceHandle: "a",
      target: "a1c691b3-9395-419d-b79f-f8df2a791f6c",
    },
    {
      id: "fc522697-88f1-43d7-b4ab-2f23b6f02c9f",
      source: "a1c691b3-9395-419d-b79f-f8df2a791f6c",
      sourceHandle: "a",
      target: "32e1d9e6-879f-4c94-969f-2a140d628b1c",
    },
    {
      id: "4f87c82f-ff7c-4b88-9950-4c086ee3a511",
      source: "0166fe65-3b1f-46b2-9429-d8b7d5ba691a",
      sourceHandle: "a",
      target: "52584b2b-608e-44ae-995b-35e086ade0d9",
    },
    {
      id: "e1ce652a-3b15-4ad6-b242-7f4c4caf2bee",
      source: "8ef094f8-760f-4e8d-8374-896510f10f1f",
      sourceHandle: "a",
      target: "d69b0f03-335f-494c-badb-69158270c32b",
    },
    {
      id: "56d8c20c-4655-48b4-8664-c418f3d840f0",
      source: "723aae76-e15e-4bd2-819e-7f3e392ea4ea",
      sourceHandle: "a",
      target: "2b71c016-7dbb-4b0d-81cc-1d07d332f595",
    },
  ],
  zoom: 0.5215569806775638,
  position: [23.649061695226692, 280.46897322607316],
};
