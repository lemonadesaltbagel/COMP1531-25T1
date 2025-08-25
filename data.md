```javascript
let data = {
    users: [
        {
            userId: 1,
            nameFirst: "John",
            nameLast: "Smith",
            email: "john@example.com",
            password: ["1234567"],
            numSuccessfulLogins: 3,
            numFailedPasswordsSinceLastLogin: 1,
            quizzesOwned: [1, 2],
        },
        {
            userId: 2,
            nameFirst: "Alice",
            nameLast: "Johnson",
            email: "alice@example.com",
            password: ["passwor6"],
            numSuccessfulLogins: 5,
            numFailedPasswordsSinceLastLogin: 0,
            quizzesOwned: [],
        }
    ],
    quizzes: [
        {
            quizId: 1,
            userId: 1,
            name: "General Knowledge",
            description: "A quiz about general knowledge.",
            timeCreated: 1683125870,
            timeLastEdited: 1683125871,
            questions: [
                {
                    questionId: 1,
                    content: "What is the capital of France?",
                    correctAnswer: "Paris",
                },
                {
                    questionId: 2,
                    content: "Which planet is known as the Red Planet?",
                    correctAnswer: "Mars",
                }
            ]
        },
        {
            quizId: 2,
            userId: 1,
            name: "Science Trivia",
            description: "A quiz about science trivia.",
            timeCreated: 1683125880,
            timeLastEdited: 1683125881,
            questions: [
                {
                    questionId: 3,
                    content: "What is the chemical symbol for water?",
                    correctAnswer: "H2O",
                },
                {
                    questionId: 4,
                    content: "What gas do plants absorb from the atmosphere?",
                    correctAnswer: "CO2",
                }
            ]
        }
    ]
};


```

[Optional] short description: 
