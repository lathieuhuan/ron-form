# Ron Form

A TypeScript form library inspired by Angular Form, has built-in React bindings for integration.

## Overview

Ron Form is a TypeScript library for managing form state, validation, and submission. It's designed to be flexible, composable, and strongly typed.

## Core Concepts

The library is built around a hierarchical control system:

```
BaseControl
└── ItemControl
└── ParentControl
    └── ListControl
    └── GroupControl
        └── FormControl
```

- BaseControl: The foundation class that defines abstract properties & methods, provides common validation and state management functionality
- ItemControl: The smallest form control unit, usually used for primitive values
- GroupControl: For managing record (object) of controls
- ListControl: For managing array of controls
- FormControl: Group control with form submit functionality

## Key Features

- Type-safe: Full TypeScript support
- Validation: Synchronous and asynchronous validation
- Composable: Build complex forms by composing controls
- Reactive: Subscribe to value and state changes
- React Integration: React hooks and components for easy integration
