# Face Recognition

This repository contains the implementation of face recognition using Adonis.js, allowing users to register and check faces.

## Getting Started

To get started with the project, follow these steps:

1. Clone the repository:
```
git clone https://github.com/mdzk/face-recognition.git
```

2. Navigate to the project directory:
```
cd face-recognition
```

3. Install dependencies:
```
npm install
```

4. Run migrations:
```
node ace migration:run
```

5. Start the development server:
```
npm run dev
```

## API Reference

#### Register Face

```http
  PUT /api/register
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `userId` | `uuid` | **Required**. Id of item to create or update |
| `face` | `file` | **Required**. Image file |

#### Check Face

```http
  PUT /api/check
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `userId` | `uuid` | **Required**. Id of item to create or update |
| `face` | `file` | **Required**. Image file |



## Acknowledgements

Special thanks to [Njin Labs](https://github.com/njinlabs) for the original repository.
