const width = 2500;
const height = 1686;
const xSegment = width/3;
const ySegment = height/2;

const RichMenuTemplate={
	"size":{
	    "width":width,
	    "height":height
	},
	"selected":true,
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
	          "data":"type=TEAM_LEADERS&urlCode=celtics"
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
	          "data":"type=TEAM_ROSTER&urlCode=celtics"
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
	          "data":"type=TEAM_SCHEDULE&urlCode=celtics"
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

module.exports.RichMenuTemplate = RichMenuTemplate;
