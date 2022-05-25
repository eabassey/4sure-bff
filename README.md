## 4sure BFF Stuff

- Run `npm install`
- Run `npm start`
- App will be running on port `3030`.
- Test:
```
Use endpoint: http://localhost:3030/query
```
With body:
```json
{
	"backends": [
		{
			"url": "https://sildev.4-sure.net:10000/api/v1/staff_action/get_summary/",
			"key": "data",
			"root": "payload",
			"query": [
				{"$project": {"ID": "$id", "firstName": "$applicant.first_name", "lastName": "$applicant.surname"}},
				{"$limit": 2},
				{"$sort": {"ID": 0}}
			]
		},
		{
			"url": "https://sildev.4-sure.net:10000/api/v1/staff_action/get_summary/",
			"key": "data2",
			"root": "payload",
			"query": [
				{"$project": {"ID": "$id", "applicant": "$applicant"}},
				{"$limit": 5}
			]
		}
	]
}
```

- Just add appropriate Authorization header with token.