const width = 2500;
const height = 1686;
const xSegment = width/3;
const ySegment = height/2;

module.exports.getRichMenuTemplate = (teamUrlCode)=>{
	return {
		"size":{
		    "width":width,
		    "height":height
		},
		"selected":false,
		"name":"Main Menu",
		"chatBarText":"Main Menu",
		"areas":[
		    {
		      "bounds":{
		          "x":xSegment*0,
		          "y":ySegment*0,
		          "width":xSegment,
		          "height":ySegment
		      },
		      "action":{
		          "type":"postback",
		          "data":`type=TEAM_LEADERS&urlCode=${teamUrlCode}`
		      }
		    },
		    {
		      "bounds":{
		          "x":xSegment*1,
		          "y":ySegment*0,
		          "width":xSegment,
		          "height":ySegment
		      },
		      "action":{
		          "type":"postback",
		          "data":`type=TEAM_ROSTER&urlCode=${teamUrlCode}`
		      }
		    },
		    {
		      "bounds":{
		          "x":xSegment*2,
		          "y":ySegment*0,
		          "width":xSegment,
		          "height":ySegment
		      },
		      "action":{
		          "type":"postback",
		          "data":`type=TEAM_SCHEDULE&urlCode=${teamUrlCode}`
		      }
		    },
		    {
		      "bounds":{
		          "x":xSegment*0,
		          "y":ySegment*1,
		          "width":xSegment,
		          "height":ySegment
		      },
		      "action":{
		          "type":"postback",
		          "data":"type=TEAM_LIST"
		      }
		    },
		    {
		      "bounds":{
		          "x":xSegment*1,
		          "y":ySegment*1,
		          "width":xSegment,
		          "height":ySegment
		      },
		      "action":{
		          type: 'datetimepicker',
		          label: 'Game by date',
		          data: 'type=DATE',
		          mode: 'date'
		      }
		    },
		    {
		      "bounds":{
		          "x":xSegment*2,
		          "y":ySegment*1,
		          "width":xSegment,
		          "height":ySegment
		      },
		      "action":{
		          "type":"postback",
		          "data":"type=help"
		      }
		    }
		]
	}
}
