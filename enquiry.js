(() => {
 const form=document.getElementById("enquiryForm"), message=document.getElementById("enquiryMessage");
 form.addEventListener("submit",e=>{
  e.preventDefault();
  const enquiry={id:"ENQ-"+Date.now().toString(36).toUpperCase(),name:document.getElementById("enqName").value.trim(),email:document.getElementById("enqEmail").value.trim(),booking:document.getElementById("enqBooking").value.trim(),topic:document.getElementById("enqTopic").value,text:document.getElementById("enqMessage").value.trim(),createdAt:new Date().toISOString()};
  const all=JSON.parse(localStorage.getItem("wayoraEnquiriesV1")||"[]");all.unshift(enquiry);localStorage.setItem("wayoraEnquiriesV1",JSON.stringify(all));
  message.textContent=`Thanks, ${enquiry.name}. Your demo enquiry reference is ${enquiry.id}. The message is saved in this browser only and has not been sent to a support team.`;form.reset();
 });
})();