const IsoTimeFormate =(dateTime) =>{
    const date = new Date(dateTime);
    const LocalTime = date.toLocaleDateString('en-US',{
        hour: '2-digit',
        minute:'2-digit',
        hour12:true,

    });
    return LocalTime;

}

export default IsoTimeFormate
