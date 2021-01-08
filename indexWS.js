const serverName = window.location.hostname;
async function getRelays(){
	let resp = await fetch(`http://${serverName}:4000/relays`);
	let data = await resp.json();
	return Promise.resolve(data);
};

const socket = new WebSocket(`ws://${serverName}:4001`);

socket.addEventListener('message', (event)=>{
	let data = JSON.parse(event.data);
	if(data.item === 'sensor'){
		data.state.forEach((item)=>updateDataSensor(item.number, item.state));
	}
	if(data.item === 'relay'){
		data.state.forEach((item, index)=>{
			if(item.state === 1){
				buttons[index].classList.add('but_on');
			} else if(item.state === 0){
				buttons[index].classList.remove('but_on');
			}
		});
	}
});

window.addEventListener('unload', ()=>{
	socket.close();
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
		socket.send(JSON.stringify({name:'swich-reley', number: index+1 }));
	});
});

butBeepIco.ondragstart = () => false;
window.oncontextmenu = function() { return false; };
butBeepIco.addEventListener('pointerup', ()=>{socket.send('beep_off')});
butBeepIco.addEventListener('pointerdown', ()=>{socket.send('beep_on')});
butBeep.addEventListener('pointerup', ()=>{if(event.target===butBeep) socket.send('beep_off')});
butBeep.addEventListener('pointerdown', ()=>{if(event.target===butBeep) socket.send('beep_on')});

toggleClassButtons();




