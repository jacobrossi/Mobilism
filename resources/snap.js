var snapNode = document.getElementById("presentation");
var snapPoint;
var scrollIncrement = 20;

document.getElementById("presentation_box").addEventListener("wheel", processWheel);

function processWheel(evt) {
	doSnap(evt.deltaY > 0);
	evt.preventDefault();
}

function doSnap(goForward) {
	var scrollAmount = 1008;//parseInt(snapNode.getBoundingClientRect().width);
	if(goForward) {
		snapPoint = Math.min(snapNode.scrollWidth - scrollAmount, snapNode.scrollLeft + scrollAmount);
	}else {
		snapPoint = Math.max(0, snapNode.scrollLeft - scrollAmount);
	}
	//window.requestAnimationFrame(scrollFrame);
	snapNode.scrollLeft = snapPoint;
}

function scrollFrame() {
	if(snapNode.scrollLeft < snapPoint) {
		snapNode.scrollLeft += scrollIncrement;
		requestAnimationFrame(scrollFrame);
	}else if(snapNode.scrollLeft > snapPoint) {
		snapNode.scrollLeft -= scrollIncrement;
		requestAnimationFrame(scrollFrame);
	}
}
