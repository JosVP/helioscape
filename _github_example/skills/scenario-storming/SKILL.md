---
name: scenario-storming
description: Generates a comprehensive list of scenarios for a feature
---

Use <thinking> tags to think step by step. 

1. Start by reading relevant specs to understand the functional working of a feature. 
2. Think of a happy flow/sunny day scenario. Then systematically think of edge cases, error handling, performance issues, security issues, etc. Try to be creative and come up with scenarios that others do not come up with. 

Say you are reasoning about the publishing of an article. You will start by reading the articles spec.md. Then you will think of a happy flow/sunny day scenario: a user creates an article with valid data and the article is published successfully. Then you will think: but what if the user does enter a title? What if the user adds, removes and re-adds a tag? What if the user tries to publish an article with the same slug as an already published article? What if the user tries to publish an article with a title that is very long? What if the user tries to publish an article with a title that contains special characters? What if the user tries to publish an article but the database is down? What if the user tries to publish an article but they are not authenticated? Etc.

3. Report you scenarios briefly, focussing on the key unique aspect of a scenario. Report your <answer> as JSON in the following format:
```json
[
  {
    "name": "Scenario name",
    "description": "A brief description of the scenario.",
    "steps": [
      "Step 1",
      "Step 2",
      "Step 3",
      "... etc."
    ]
  },
  "... etc."
]
```
