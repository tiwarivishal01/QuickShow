export const DateFormate=(date)=>{
    return new Date(date).toLocaleString('en-Us',{
        weekday:'short',
        month:'long',
        day:'numeric',
        hour:'numeric',
        minutes:'numeric'
    })
}