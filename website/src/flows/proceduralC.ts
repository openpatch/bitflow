import { FlowSchema, IFlow } from "@bitflow/flow";

export const proceduralC = FlowSchema.parse({
  name: "Procedural Programming in C",
  draft: false,
  nodes: [
    {
      id: "1a32d231-d47c-4b6a-856e-4ba277257161",
      position: { x: -62, y: 19 },
      type: "start",
      data: {
        view: {
          title: "Start",
          markdown:
            '# Welcome to this assessment\n\nThis assessment is meant to evaluate how much you already know about some topics of the course "Procedural Programming in C". \n\nYou do not need to answer anything right to be able to attent the course. You will learn about Programming and C in the course.\n\nThe results will help lectures to understand what previous knowledge you and other students have. This information can be used to adapt the course to your needs.\n\nThis assessment is part of a PhD Project. By doing the assessment you agree that your data can be used in for this project. No personal data will be collected.\n\nIf you want to know more about the project you can write me an e-mail: [mike.barkmin@uni-due.de](mailto:mike.barkmin@uni-de.de)',
        },
      },
    },
    {
      id: "1c1b736f-7f56-4504-b424-a201307918d7",
      position: { x: 2548, y: 21 },
      type: "end",
      data: {
        view: {
          markdown:
            "# Thanks for your participation!\n\nI hope you got something out of the assessment.\n\nIf you are interessted in doing more assessments like this you can write me an e-mail: [mike.barkmin@uni-due.de](mailto:mike.barkmin@uni-due.de)",
          showPoints: true,
          listResults: false,
        },
      },
    },
    {
      id: "45a2e52f-7ef9-468d-a377-1b09ded7179e",
      position: { x: -34, y: 158.5 },
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
                "A well-ordered collection of unambiguous and effectively computable operations that when executed produces a result and halts in a reasonably short amount of time.",
            },
            {
              markdown:
                "A well-ordered collection of unambiguous and effectively computable operations that when executed produces a result and halts in a finite amount of time.",
            },
            {
              markdown:
                "A collection of unambiguous and effectively computable operations that when executed produces a result and halts in a finite amount of time.",
            },
            {
              markdown:
                "A collection of unambiguous and effectively computable operations that when executed produces a result and halts in a finite amount of time.",
            },
            {
              markdown:
                "A well-ordered collection of unambiguous and effectively computable operations.",
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
                  "Option B provides the best definition.  A key component is that in order to be an algorithm, it must eventually halt.",
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
      position: { x: 1079, y: 141.1999969482422 },
      type: "task",
      data: {
        name: "Data Type Size in C",
        description: "CQB 633236",
        subtype: "choice",
        view: {
          instruction:
            "This code fails to compile:\n\n```c\nchar current = 'a';\ncurrent = current + 1;\n```\n\nWhy?",
          variant: "single",
          choices: [
            { markdown: "We can't add ints and chars." },
            { markdown: "We're trying to squeeze an int into a char." },
            { markdown: "The character after 'a' is platform-dependent." },
            { markdown: "We're trying to squeeze a String into a char." },
            { markdown: "The assignment is infinitely recursive." },
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
            b: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: {
                message:
                  "The char is promoted to an int when an int is added to it. Thus, our right-hand side is an int while our left-hand side is a char. Assigning an int into a char may result in information less, which requires us to sign off on this risky operation with an explicit cast.",
                severity: "error",
              },
            },
            a: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
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
      id: "52584b2b-608e-44ae-995b-35e086ade0d9",
      position: { x: 1982, y: 137.1999969482422 },
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
              notCheckedFeedback: {
                message:
                  "This is the correct answer; %d is used for reading in integers.",
                severity: "error",
              },
            },
            d: {
              checkedFeedback: {
                message:
                  "The \\n is unnecessary. Finally, scanf requires a pointer to a variable's address.",
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
      position: { x: 1665.2630242833707, y: 135.42852573246483 },
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
                "Each parameter of a procedure musst have the same type.",
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
                message: "A procedura can have zero parameters.",
                severity: "error",
              },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            b: {
              checkedFeedback: {
                message:
                  "The parameter of a procedura can have different types.",
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
      position: { x: 1849.2630242833707, y: -6.571474267535166 },
      type: "task",
      data: {
        name: "Procedures Dynamic in C",
        description: "CQB ID 631999",
        subtype: "choice",
        view: {
          instruction:
            "Which of the following assertions about methods is correct?",
          variant: "multiple",
          choices: [
            {
              markdown:
                "The body of a method must contain at least one return statement.",
            },
            { markdown: "A method must return a value." },
            {
              markdown:
                "A method invocation must contain at least one argument.",
            },
            {
              markdown:
                "A method with no return statement must not be invoked on the right side of an assignment statement.",
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
                  "A procedure in C must have as many arguments as the procedure has parameters.",
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
      position: { x: 250.26302428337067, y: 157.42852573246478 },
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
      position: { x: 663.2630242833707, y: 15.428525732464834 },
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
      position: { x: 470.26302428337067, y: 152.42852573246483 },
      type: "task",
      data: {
        name: "for-Loop Number Sequence",
        description: "CQB ID 618978",
        subtype: "choice",
        view: {
          instruction:
            "Fill the gap in such a way that the odd number less than 10 and greater than zero is printed.\n```c\nfor (##MISSING_CODE##)\n    System.out.println(i+1);\n```",
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
      position: { x: 788.2630242833707, y: 145.42852573246478 },
      type: "task",
      data: {
        name: "while-Loop Asterisks",
        description: "CQB 618985",
        subtype: "choice",
        view: {
          instruction:
            'How many asterisks will be printed as a result of executing this code?\n\n```\nint counter = 0, N = 10;\n\nwhile (counter++ < N)\n{\n    if (counter%2 == 0)\n        continue;\n    System.out.print("*");\n}\n```',
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
      position: { x: 202.26302428337067, y: 5.428525732464834 },
      type: "task",
      data: {
        name: "Simple if-else",
        description: "Custom",
        subtype: "choice",
        view: {
          instruction:
            'What does this print when **x** is assigned to 1?\n\n```c\nif (x > 1) {\n  System.out.println("a")\n} else if (x > 0) {\n  System.out.println("b")\n} else if (x > -1) {\n  System.out.println("c")\n}\n```',
          variant: "single",
          choices: [
            { markdown: "```\na\n```" },
            { markdown: "```\nb\n```" },
            { markdown: "```\nc\n```" },
            { markdown: "```\nb\nc\n```" },
            { markdown: "```\na\nb\nc\n```" },
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
      position: { x: 426.26302428337067, y: 12.428525732464834 },
      type: "task",
      data: {
        name: "Operator Names",
        description: "CQB 632064",
        subtype: "choice",
        view: {
          instruction:
            "Consider this section of code.\n\n```c\nint a = 3, b = 4, c = 5;\n\nbool x = a * b <= c;\n```\n\nThe expression contains an arithmetic operator, an assignment operator and a relational operator. Which is which?",
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
              notCheckedFeedback: {
                message:
                  "Operators are: multiply, assignment and less than or equal",
                severity: "error",
              },
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
      position: { x: 1291.2630242833707, y: 4.428525732464834 },
      type: "task",
      data: {
        name: "Scalar Data Types in C",
        description: "CQB 632094",
        subtype: "choice",
        view: {
          instruction:
            "Which of the following is **NOT** a scalar/primitive data type in C?",
          variant: "multiple",
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
                severity: "error",
              },
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
      id: "59c7163b-f626-4e08-af43-0c62712071e2",
      position: { x: 987.2630242833707, y: 0.4285257324647773 },
      type: "task",
      data: {
        name: "Data Type for Variable",
        description: "CQB 633401",
        subtype: "choice",
        view: {
          instruction:
            "You see the expression `n = -250` in some C-code that successfully compiles. What type can `n` **not** be, if there is no overflow?",
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
        feedback: { patterns: {}, choices: {} },
      },
    },
    {
      id: "8ef094f8-760f-4e8d-8374-896510f10f1f",
      position: { x: 2215.2630242833707, y: 139.42852573246478 },
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
            b: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: {
                message: "Dynamic alloc goes on heap; static goes on stack.",
                severity: "error",
              },
            },
            a: {
              checkedFeedback: { message: "", severity: "error" },
              notCheckedFeedback: { message: "", severity: "error" },
            },
            c: {
              checkedFeedback: { message: "", severity: "error" },
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
      id: "dab5c2bb-1c40-4ee2-84d3-980378f42b08",
      position: { x: 2126.2630242833707, y: -4.571474267535223 },
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
          enableRetry: false,
          showFeedback: false,
          correct: [],
        },
        feedback: { patterns: {}, choices: {} },
      },
    },
    {
      id: "1848d78b-ce2a-4eaf-961a-141885df17af",
      position: { x: 1553.2630242833707, y: -4.571474267535223 },
      type: "task",
      data: {
        name: "Use-Case for Linked List",
        description: "CQB ID 634951",
        subtype: "choice",
        view: {
          instruction:
            "You don't know exactly how much data you need to store, but there's not much of it. You'd like to not allocate any memory that won't be used. You do not need to be able to search the collection quickly. What is the simplest data structure that best suits for your needs?",
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
      position: { x: 1364.2630242833707, y: 135.42852573246478 },
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
  ],
  edges: [
    {
      id: "94899c84-4c7b-4046-9526-0047ead21b9d",
      source: "1a32d231-d47c-4b6a-856e-4ba277257161",
      sourceHandle: "a",
      target: "45a2e52f-7ef9-468d-a377-1b09ded7179e",
    },
    {
      id: "23e8e0b8-02a1-43d5-99d0-2f64e3ade23a",
      source: "45a2e52f-7ef9-468d-a377-1b09ded7179e",
      sourceHandle: "a",
      target: "c5420a72-3959-491a-88de-2dafd3ed8e80",
    },
    {
      id: "d8b03202-c2a5-4e09-aa01-7a43ff2bf6d2",
      source: "c5420a72-3959-491a-88de-2dafd3ed8e80",
      sourceHandle: "a",
      target: "14abdd58-5a56-4132-ba40-def3fac4deb0",
    },
    {
      id: "63107060-3031-4794-8317-50afd906cba4",
      source: "14abdd58-5a56-4132-ba40-def3fac4deb0",
      sourceHandle: "a",
      target: "04645e2a-0617-4007-81a7-acf11ab34938",
    },
    {
      id: "ce5142d2-fbdc-4e05-9615-770099b7d3b1",
      source: "04645e2a-0617-4007-81a7-acf11ab34938",
      sourceHandle: "a",
      target: "bbd56c39-d515-4f6f-9ec8-e2a761d7552a",
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
      id: "1dc3e8cd-2a92-4a94-a87e-5698d20c6bdc",
      source: "9bbb0330-4c95-455d-ac1a-20348b032752",
      sourceHandle: "a",
      target: "59c7163b-f626-4e08-af43-0c62712071e2",
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
      id: "f8776479-c14d-4e3c-b7b9-404884dd800c",
      source: "50bd2282-39cc-4d60-8cda-06585ee383d5",
      sourceHandle: "a",
      target: "ceb05fff-ee4e-4aaf-bfa2-dfd060f87fac",
    },
    {
      id: "c0041c4e-7361-4de8-9875-3f3a564ae790",
      source: "1848d78b-ce2a-4eaf-961a-141885df17af",
      sourceHandle: "a",
      target: "70045660-5ce5-4aee-8595-21e138cfd125",
    },
    {
      id: "2669f0ec-b81c-4f75-8b09-e4ffe35046b3",
      source: "70045660-5ce5-4aee-8595-21e138cfd125",
      sourceHandle: "a",
      target: "a1c691b3-9395-419d-b79f-f8df2a791f6c",
    },
    {
      id: "e465ea36-0274-4c6f-aabf-4d0940e19e3e",
      source: "a1c691b3-9395-419d-b79f-f8df2a791f6c",
      sourceHandle: "a",
      target: "52584b2b-608e-44ae-995b-35e086ade0d9",
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
      id: "1fa15f0d-0109-411d-b09c-150fc11a9880",
      source: "8ef094f8-760f-4e8d-8374-896510f10f1f",
      sourceHandle: "a",
      target: "1c1b736f-7f56-4504-b424-a201307918d7",
    },
  ],
  zoom: 1,
  position: [-1434.2630242833707, 227.7714712157774],
} as IFlow);
