const serverName = window.location.hostname;
async function getRelays(){
	let resp = await fetch(`http://${serverName}:4000/relays`);
	let data = await resp.json();
	return Promise.resolve(data);
};

const socket = new WebSocket(`ws://${serverName}:4001`);

socket.addEventListener('message', (event)=>{
	let sensors = JSON.parse(event.data);
	console.log(sensors);
	sensors.forEach((item)=>updateDataSensor(item.number, item.state));
})

const updateDataSensor = (number, data)=>{
	let sens = document.getElementById(`state${number}`);
	if(data === 0){
		sens.innerText = 'off';
		sens.classList.remove('state_on');
	}
	if(data === 1){
		sens.innerText = 'on';
		sens.classList.add('state_on');
	}
}

const getButtons = ()=>{
	return [
	document.getElementsByClassName('but1')[0],
	document.getElementsByClassName('but2')[0],
	document.getElementsByClassName('but3')[0],
	document.getElementsByClassName('but4')[0],
	];
};


const butBeep = document.getElementsByClassName('bip')[0];
const butBeepIco = document.getElementById('ico');

const toggleClassButtons = ()=>{
	getRelays().then((relays)=>{
		relays.forEach((item, index)=>{
			if(item.state === 1){
				buttons[index].classList.add('but_on');
			} else if(item.state === 0){
				buttons[index].classList.remove('but_on');
			}
		})
	});
}

let buttons = getButtons();

buttons.forEach((item, index)=>{
	item.addEventListener('click', ()=>{
		let command = item.classList.contains('but_on')? 'off': 'on';
		let button = index+1;

		fetch(`http://${serverName}:4000/click-switcher`, {
			method: 'POST',
			body: JSON.stringify({name: button, command: command})
		}).then((resp)=>{
			if(resp.ok){
				toggleClassButtons();
			}
		}).catch((e)=>console.log(e))
	});
});

function sendCommandBeep(command){
	socket.send('command');
}

butBeepIco.ondragstart = () => false;
window.oncontextmenu = function() { return false; };
//butBeepIco.addEventListener('mouseup', ()=>{socket.send('beep_off')});
//butBeepIco.addEventListener('mousedown', ()=>{socket.send('beep_on')});
//butBeep.addEventListener('mouseup', ()=>{if(event.target===butBeep) socket.send('beep_off')});
//butBeep.addEventListener('mousedown', ()=>{if(event.target===butBeep) socket.send('beep_on')});
butBeepIco.addEventListener('pointerup', ()=>{socket.send('beep_off')});
butBeepIco.addEventListener('pointerdown', ()=>{socket.send('beep_on')});
butBeep.addEventListener('pointerup', ()=>{if(event.target===butBeep) socket.send('beep_off')});
butBeep.addEventListener('pointerdown', ()=>{if(event.target===butBeep) socket.send('beep_on')});


toggleClassButtons();




