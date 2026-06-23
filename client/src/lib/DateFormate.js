export const DateFormate=(date)=>{
    if (!date) return "N/A";
    
    try {
        return new Date(date).toLocaleString('en-US',{
            weekday:'short',
            month:'long',
            day:'numeric',
            hour:'numeric',
            minute:'numeric'
        });
    } catch (error) {
        console.error("Date formatting error:", error);
        return "Invalid date";
    }
}