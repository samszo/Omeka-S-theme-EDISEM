let user = false;

function showDetail(e,d){
    console.log(e,d);
    let dt = d.data ? d.data : d;
    if(!d.modal){
        let t = e.currentTarget.id ? e.currentTarget.id : 'mainContent';
        //merci à https://stephanwagner.me/jBox/documentation
        d.modal = new jBox('Modal', {
            title: '---',
            overlay: false,
            draggable: 'title',
            repositionOnOpen: true,
            repositionOnContent: true,
            target: '#'+t,
            position: {
                x: 'left',
                y: 'top'
            },
            title:dt['titre'] ? dt['titre'] : dt['o:title'],
            content:getModalContent(d),
            onCloseComplete:function(){
                if(d.fctCloseDetail){
                    d.modal = false;
                    d.fctCloseDetail(d);
                }
            }
        })
    }
    d.modal.open();            
}

function getModalContent(d){
    let dt = d.data ? d.data : d;    
    return `<iframe 
    width="600"
    height="600"
    src="${user ? dt.adminUrl : dt.siteUrl}"></iframe>`;

}