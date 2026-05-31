const palettes = {
    mard291: {
        name: 'MARD 全色 291',
        info: 'MARD 是国内最受欢迎的拼豆品牌，291色全色系覆盖所有常用颜色，是目前国内拼豆玩家使用最广泛的品牌。在标准221色基础上增加了P/Q/R/T/Y/ZG扩展系列。',
        series: {
            A: { name: '黄色系', icon: 'A', color: '#FFD700', colors: [
                {name:'A1',hex:'#FAF4C8'},{name:'A2',hex:'#FFFFD5'},{name:'A3',hex:'#FEFF8B'},{name:'A4',hex:'#FBED56'},{name:'A5',hex:'#F4D738'},
                {name:'A6',hex:'#FEAC4C'},{name:'A7',hex:'#FE8B4C'},{name:'A8',hex:'#FFDA45'},{name:'A9',hex:'#FF995B'},{name:'A10',hex:'#F77C31'},
                {name:'A11',hex:'#FFDD99'},{name:'A12',hex:'#FE9F72'},{name:'A13',hex:'#FFC365'},{name:'A14',hex:'#FD543D'},{name:'A15',hex:'#FFF365'},
                {name:'A16',hex:'#FFFF9F'},{name:'A17',hex:'#FFE36E'},{name:'A18',hex:'#FEBE7D'},{name:'A19',hex:'#FD7C72'},{name:'A20',hex:'#FFD568'},
                {name:'A21',hex:'#FFE395'},{name:'A22',hex:'#F4F57D'},{name:'A23',hex:'#E6C9B7'},{name:'A24',hex:'#F7F8A2'},{name:'A25',hex:'#FFD67D'},
                {name:'A26',hex:'#FFC830'}
            ]},
            B: { name: '绿色系', icon: 'B', color: '#4CAF50', colors: [
                {name:'B1',hex:'#E6EE31'},{name:'B2',hex:'#63F347'},{name:'B3',hex:'#9EF780'},{name:'B4',hex:'#5DE035'},{name:'B5',hex:'#35E352'},
                {name:'B6',hex:'#65E2A6'},{name:'B7',hex:'#3DAF80'},{name:'B8',hex:'#1C9C4F'},{name:'B9',hex:'#27523A'},{name:'B10',hex:'#95D3C2'},
                {name:'B11',hex:'#5D722A'},{name:'B12',hex:'#166F41'},{name:'B13',hex:'#CAEB7B'},{name:'B14',hex:'#ADE946'},{name:'B15',hex:'#2E5132'},
                {name:'B16',hex:'#C5ED9C'},{name:'B17',hex:'#9BB13A'},{name:'B18',hex:'#E6EE49'},{name:'B19',hex:'#24B88C'},{name:'B20',hex:'#C2F0CC'},
                {name:'B21',hex:'#156A6B'},{name:'B22',hex:'#0B3C43'},{name:'B23',hex:'#303A21'},{name:'B24',hex:'#EEFCA5'},{name:'B25',hex:'#4E846D'},
                {name:'B26',hex:'#8D7A35'},{name:'B27',hex:'#CCE1AF'},{name:'B28',hex:'#9EE5B9'},{name:'B29',hex:'#C5E254'},{name:'B30',hex:'#E2FCB1'},
                {name:'B31',hex:'#B0E792'},{name:'B32',hex:'#9CAB5A'}
            ]},
            C: { name: '蓝色系', icon: 'C', color: '#2196F3', colors: [
                {name:'C1',hex:'#E8FFE7'},{name:'C2',hex:'#A9F9FC'},{name:'C3',hex:'#A0E2FB'},{name:'C4',hex:'#41CCFF'},{name:'C5',hex:'#01ACEB'},
                {name:'C6',hex:'#50AAF0'},{name:'C7',hex:'#3677D2'},{name:'C8',hex:'#0F54C0'},{name:'C9',hex:'#324BCA'},{name:'C10',hex:'#3EBCE2'},
                {name:'C11',hex:'#28DDDE'},{name:'C12',hex:'#1C334D'},{name:'C13',hex:'#CDE8FF'},{name:'C14',hex:'#D5FDFF'},{name:'C15',hex:'#22C4C6'},
                {name:'C16',hex:'#1557A8'},{name:'C17',hex:'#04D1F6'},{name:'C18',hex:'#1D3344'},{name:'C19',hex:'#1887A2'},{name:'C20',hex:'#176DAF'},
                {name:'C21',hex:'#BEDDFF'},{name:'C22',hex:'#67B4BE'},{name:'C23',hex:'#C8E2FF'},{name:'C24',hex:'#7CC4FF'},{name:'C25',hex:'#A9E5E5'},
                {name:'C26',hex:'#3CAED8'},{name:'C27',hex:'#D3DFFA'},{name:'C28',hex:'#BBCFED'},{name:'C29',hex:'#34488E'}
            ]},
            D: { name: '紫色系', icon: 'D', color: '#9C27B0', colors: [
                {name:'D1',hex:'#AEB4F2'},{name:'D2',hex:'#858EDD'},{name:'D3',hex:'#2F54AF'},{name:'D4',hex:'#182A84'},{name:'D5',hex:'#B843C5'},
                {name:'D6',hex:'#AC7BDE'},{name:'D7',hex:'#8854B3'},{name:'D8',hex:'#E2D3FF'},{name:'D9',hex:'#D5B9F8'},{name:'D10',hex:'#361851'},
                {name:'D11',hex:'#B9BAE1'},{name:'D12',hex:'#DE9AD4'},{name:'D13',hex:'#B90095'},{name:'D14',hex:'#8B279B'},{name:'D15',hex:'#2F1F90'},
                {name:'D16',hex:'#E3E1EE'},{name:'D17',hex:'#C4D4F6'},{name:'D18',hex:'#A45EC7'},{name:'D19',hex:'#D8C3D7'},{name:'D20',hex:'#9C32B2'},
                {name:'D21',hex:'#9A009B'},{name:'D22',hex:'#333A95'},{name:'D23',hex:'#EBDAFC'},{name:'D24',hex:'#7786E5'},{name:'D25',hex:'#494FC7'},
                {name:'D26',hex:'#DFC2F8'}
            ]},
            E: { name: '粉色系', icon: 'E', color: '#E91E63', colors: [
                {name:'E1',hex:'#FDD3CC'},{name:'E2',hex:'#FEC0DF'},{name:'E3',hex:'#FFB7E7'},{name:'E4',hex:'#E8649E'},{name:'E5',hex:'#F551A2'},
                {name:'E6',hex:'#F13D74'},{name:'E7',hex:'#C63478'},{name:'E8',hex:'#FFDBE9'},{name:'E9',hex:'#E970CC'},{name:'E10',hex:'#D33793'},
                {name:'E11',hex:'#FCDDD2'},{name:'E12',hex:'#F78FC3'},{name:'E13',hex:'#B5006D'},{name:'E14',hex:'#FFD1BA'},{name:'E15',hex:'#F8C7C9'},
                {name:'E16',hex:'#FFF3EB'},{name:'E17',hex:'#FFE2EA'},{name:'E18',hex:'#FFC7DB'},{name:'E19',hex:'#FEBAD5'},{name:'E20',hex:'#D8C7D1'},
                {name:'E21',hex:'#BD9DA1'},{name:'E22',hex:'#B785A1'},{name:'E23',hex:'#937A8D'},{name:'E24',hex:'#E1BCE8'}
            ]},
            F: { name: '红色系', icon: 'F', color: '#F44336', colors: [
                {name:'F1',hex:'#FD957B'},{name:'F2',hex:'#FC3D46'},{name:'F3',hex:'#F74941'},{name:'F4',hex:'#FC283C'},{name:'F5',hex:'#E7002F'},
                {name:'F6',hex:'#943630'},{name:'F7',hex:'#971937'},{name:'F8',hex:'#BC0028'},{name:'F9',hex:'#E2677A'},{name:'F10',hex:'#8A4526'},
                {name:'F11',hex:'#5A2121'},{name:'F12',hex:'#FD4E6A'},{name:'F13',hex:'#F35744'},{name:'F14',hex:'#FFA9AD'},{name:'F15',hex:'#D30022'},
                {name:'F16',hex:'#FEC2A6'},{name:'F17',hex:'#E69C79'},{name:'F18',hex:'#D37C46'},{name:'F19',hex:'#C1444A'},{name:'F20',hex:'#CD9391'},
                {name:'F21',hex:'#F7B4C6'},{name:'F22',hex:'#FDC0D0'},{name:'F23',hex:'#F67E66'},{name:'F24',hex:'#E698AA'},{name:'F25',hex:'#E54B4F'}
            ]},
            G: { name: '棕色系', icon: 'G', color: '#795548', colors: [
                {name:'G1',hex:'#FFE2CE'},{name:'G2',hex:'#FFC4AA'},{name:'G3',hex:'#F4C3A5'},{name:'G4',hex:'#E1B383'},{name:'G5',hex:'#EDB045'},
                {name:'G6',hex:'#E99C17'},{name:'G7',hex:'#9D5B3E'},{name:'G8',hex:'#753832'},{name:'G9',hex:'#E6B483'},{name:'G10',hex:'#D98C39'},
                {name:'G11',hex:'#E0C593'},{name:'G12',hex:'#FFC890'},{name:'G13',hex:'#B7714A'},{name:'G14',hex:'#8D614C'},{name:'G15',hex:'#FCF9E0'},
                {name:'G16',hex:'#F2D9BA'},{name:'G17',hex:'#78524B'},{name:'G18',hex:'#FFE4CC'},{name:'G19',hex:'#E07935'},{name:'G20',hex:'#A94023'},
                {name:'G21',hex:'#B88558'}
            ]},
            H: { name: '黑白灰系', icon: 'H', color: '#333333', colors: [
                {name:'H1',hex:'#FDFBFF'},{name:'H2',hex:'#FEFFFF'},{name:'H3',hex:'#B6B1BA'},{name:'H4',hex:'#89858C'},{name:'H5',hex:'#48464E'},
                {name:'H6',hex:'#2F2B2F'},{name:'H7',hex:'#000000'},{name:'H8',hex:'#E7D6DB'},{name:'H9',hex:'#EDEDED'},{name:'H10',hex:'#EEE9EA'},
                {name:'H11',hex:'#CECDD5'},{name:'H12',hex:'#FFF5ED'},{name:'H13',hex:'#F5ECD2'},{name:'H14',hex:'#CFD7D3'},{name:'H15',hex:'#98A6A8'},
                {name:'H16',hex:'#1D1414'},{name:'H17',hex:'#F1EDED'},{name:'H18',hex:'#FFFDF0'},{name:'H19',hex:'#F6EFE2'},{name:'H20',hex:'#949FA3'},
                {name:'H21',hex:'#FFFBE1'},{name:'H22',hex:'#CACAD4'},{name:'H23',hex:'#9A9D94'}
            ]},
            M: { name: '多彩系', icon: 'M', color: '#FF6B6B', colors: [
                {name:'M1',hex:'#BCC6B8'},{name:'M2',hex:'#8AA386'},{name:'M3',hex:'#697D80'},{name:'M4',hex:'#E3D2BC'},{name:'M5',hex:'#D0CCAA'},
                {name:'M6',hex:'#B0A782'},{name:'M7',hex:'#B4A497'},{name:'M8',hex:'#B38281'},{name:'M9',hex:'#A58767'},{name:'M10',hex:'#C5B2BC'},
                {name:'M11',hex:'#9F7594'},{name:'M12',hex:'#644749'},{name:'M13',hex:'#D19066'},{name:'M14',hex:'#C77362'},{name:'M15',hex:'#757D78'}
            ]},
            P: { name: '扩展系', icon: 'P', color: '#667eea', colors: [
                {name:'P1',hex:'#FCF7F8'},{name:'P2',hex:'#B0A9AC'},{name:'P3',hex:'#AFDCAB'},{name:'P4',hex:'#FEA49F'},{name:'P5',hex:'#EE8C3E'},
                {name:'P6',hex:'#5FD0A7'},{name:'P7',hex:'#EB9270'},{name:'P8',hex:'#F0D958'},{name:'P9',hex:'#D9D9D9'},{name:'P10',hex:'#D9C7EA'},
                {name:'P11',hex:'#F3ECC9'},{name:'P12',hex:'#E6EEF2'},{name:'P13',hex:'#AACBEF'},{name:'P14',hex:'#337680'},{name:'P15',hex:'#668575'},
                {name:'P16',hex:'#FEBF45'},{name:'P17',hex:'#FEA324'},{name:'P18',hex:'#FEB89F'},{name:'P19',hex:'#FFFEEC'},{name:'P20',hex:'#FEBECF'},
                {name:'P21',hex:'#ECBEBF'},{name:'P22',hex:'#E4A89F'},{name:'P23',hex:'#A56268'}
            ]},
            Q: { name: '荧光系', icon: 'Q', color: '#00FF00', colors: [
                {name:'Q1',hex:'#F2A5E8'},{name:'Q2',hex:'#E9EC91'},{name:'Q3',hex:'#FFFF00'},{name:'Q4',hex:'#FFEBFA'},{name:'Q5',hex:'#76CEDE'}
            ]},
            R: { name: '亮色系', icon: 'R', color: '#FF1493', colors: [
                {name:'R1',hex:'#D50D21'},{name:'R2',hex:'#F92F83'},{name:'R3',hex:'#FD8324'},{name:'R4',hex:'#F8EC31'},{name:'R5',hex:'#35C75B'},
                {name:'R6',hex:'#238891'},{name:'R7',hex:'#19779D'},{name:'R8',hex:'#1A60C3'},{name:'R9',hex:'#9A56B4'},{name:'R10',hex:'#FFDB4C'},
                {name:'R11',hex:'#FFEBFA'},{name:'R12',hex:'#D8D5CE'},{name:'R13',hex:'#55514C'},{name:'R14',hex:'#9FE4DF'},{name:'R15',hex:'#77CEE9'},
                {name:'R16',hex:'#3ECFCA'},{name:'R17',hex:'#4A867A'},{name:'R18',hex:'#7FCD9D'},{name:'R19',hex:'#CDE55D'},{name:'R20',hex:'#E8C7B4'},
                {name:'R21',hex:'#AD6F3C'},{name:'R22',hex:'#6C372F'},{name:'R23',hex:'#FEB872'},{name:'R24',hex:'#F3C1C0'},{name:'R25',hex:'#C9675E'},
                {name:'R26',hex:'#D293BE'},{name:'R27',hex:'#EA8CB1'},{name:'R28',hex:'#9C87D6'}
            ]},
            T: { name: '纯白系', icon: 'T', color: '#FFFFFF', colors: [
                {name:'T1',hex:'#FFFFFF'}
            ]},
            Y: { name: '特效系', icon: 'Y', color: '#C0C0C0', colors: [
                {name:'Y1',hex:'#FD6FB4'},{name:'Y2',hex:'#FEB481'},{name:'Y3',hex:'#D7FAA0'},{name:'Y4',hex:'#8BDBFA'},{name:'Y5',hex:'#E987EA'}
            ]},
            ZG: { name: '特别系', icon: 'ZG', color: '#FFD700', colors: [
                {name:'ZG1',hex:'#DAABB3'},{name:'ZG2',hex:'#D6AA87'},{name:'ZG3',hex:'#C1BD8D'},{name:'ZG4',hex:'#96869F'},{name:'ZG5',hex:'#8490A6'},
                {name:'ZG6',hex:'#94BFE2'},{name:'ZG7',hex:'#E2A9D2'},{name:'ZG8',hex:'#AB91C0'}
            ]}
        }
    },
    mard221: {
        name: 'MARD 标准 221',
        info: 'MARD 标准221色是经过精选的核心色系，前缀A到M，适合大多数拼豆创作需求，是国内零售最常见的版本。',
        series: {
            A: { name: '黄橙系', icon: 'A', color: '#FFD700', colors: [
                {name:'A1',hex:'#FAF4C8'},{name:'A2',hex:'#FFFFD5'},{name:'A3',hex:'#FEFF8B'},{name:'A4',hex:'#FBED56'},{name:'A5',hex:'#F4D738'},
                {name:'A6',hex:'#FEAC4C'},{name:'A7',hex:'#FE8B4C'},{name:'A8',hex:'#FFDA45'},{name:'A9',hex:'#FF995B'},{name:'A10',hex:'#F77C31'},
                {name:'A11',hex:'#FFDD99'},{name:'A12',hex:'#FE9F72'},{name:'A13',hex:'#FFC365'},{name:'A14',hex:'#FD543D'},{name:'A15',hex:'#FFF365'},
                {name:'A16',hex:'#FFFF9F'},{name:'A17',hex:'#FFE36E'},{name:'A18',hex:'#FEBE7D'},{name:'A19',hex:'#FD7C72'},{name:'A20',hex:'#FFD568'},
                {name:'A21',hex:'#FFE395'},{name:'A22',hex:'#F4F57D'},{name:'A23',hex:'#E6C9B7'},{name:'A24',hex:'#F7F8A2'},{name:'A25',hex:'#FFD67D'},
                {name:'A26',hex:'#FFC830'}
            ]},
            B: { name: '绿色系', icon: 'B', color: '#4CAF50', colors: [
                {name:'B1',hex:'#E6EE31'},{name:'B2',hex:'#63F347'},{name:'B3',hex:'#9EF780'},{name:'B4',hex:'#5DE035'},{name:'B5',hex:'#35E352'},
                {name:'B6',hex:'#65E2A6'},{name:'B7',hex:'#3DAF80'},{name:'B8',hex:'#1C9C4F'},{name:'B9',hex:'#27523A'},{name:'B10',hex:'#95D3C2'},
                {name:'B11',hex:'#5D722A'},{name:'B12',hex:'#166F41'},{name:'B13',hex:'#CAEB7B'},{name:'B14',hex:'#ADE946'},{name:'B15',hex:'#2E5132'},
                {name:'B16',hex:'#C5ED9C'},{name:'B17',hex:'#9BB13A'},{name:'B18',hex:'#E6EE49'},{name:'B19',hex:'#24B88C'},{name:'B20',hex:'#C2F0CC'},
                {name:'B21',hex:'#156A6B'},{name:'B22',hex:'#0B3C43'},{name:'B23',hex:'#303A21'},{name:'B24',hex:'#EEFCA5'},{name:'B25',hex:'#4E846D'},
                {name:'B26',hex:'#8D7A35'},{name:'B27',hex:'#CCE1AF'},{name:'B28',hex:'#9EE5B9'},{name:'B29',hex:'#C5E254'},{name:'B30',hex:'#E2FCB1'},
                {name:'B31',hex:'#B0E792'},{name:'B32',hex:'#9CAB5A'}
            ]},
            C: { name: '蓝青系', icon: 'C', color: '#2196F3', colors: [
                {name:'C1',hex:'#E8FFE7'},{name:'C2',hex:'#A9F9FC'},{name:'C3',hex:'#A0E2FB'},{name:'C4',hex:'#41CCFF'},{name:'C5',hex:'#01ACEB'},
                {name:'C6',hex:'#50AAF0'},{name:'C7',hex:'#3677D2'},{name:'C8',hex:'#0F54C0'},{name:'C9',hex:'#324BCA'},{name:'C10',hex:'#3EBCE2'},
                {name:'C11',hex:'#28DDDE'},{name:'C12',hex:'#1C334D'},{name:'C13',hex:'#CDE8FF'},{name:'C14',hex:'#D5FDFF'},{name:'C15',hex:'#22C4C6'},
                {name:'C16',hex:'#1557A8'},{name:'C17',hex:'#04D1F6'},{name:'C18',hex:'#1D3344'},{name:'C19',hex:'#1887A2'},{name:'C20',hex:'#176DAF'},
                {name:'C21',hex:'#BEDDFF'},{name:'C22',hex:'#67B4BE'},{name:'C23',hex:'#C8E2FF'},{name:'C24',hex:'#7CC4FF'},{name:'C25',hex:'#A9E5E5'},
                {name:'C26',hex:'#3CAED8'},{name:'C27',hex:'#D3DFFA'},{name:'C28',hex:'#BBCFED'},{name:'C29',hex:'#34488E'}
            ]},
            D: { name: '紫蓝系', icon: 'D', color: '#9C27B0', colors: [
                {name:'D1',hex:'#AEB4F2'},{name:'D2',hex:'#858EDD'},{name:'D3',hex:'#2F54AF'},{name:'D4',hex:'#182A84'},{name:'D5',hex:'#B843C5'},
                {name:'D6',hex:'#AC7BDE'},{name:'D7',hex:'#8854B3'},{name:'D8',hex:'#E2D3FF'},{name:'D9',hex:'#D5B9F8'},{name:'D10',hex:'#361851'},
                {name:'D11',hex:'#B9BAE1'},{name:'D12',hex:'#DE9AD4'},{name:'D13',hex:'#B90095'},{name:'D14',hex:'#8B279B'},{name:'D15',hex:'#2F1F90'},
                {name:'D16',hex:'#E3E1EE'},{name:'D17',hex:'#C4D4F6'},{name:'D18',hex:'#A45EC7'},{name:'D19',hex:'#D8C3D7'},{name:'D20',hex:'#9C32B2'},
                {name:'D21',hex:'#9A009B'},{name:'D22',hex:'#333A95'},{name:'D23',hex:'#EBDAFC'},{name:'D24',hex:'#7786E5'},{name:'D25',hex:'#494FC7'},
                {name:'D26',hex:'#DFC2F8'}
            ]},
            E: { name: '粉色系', icon: 'E', color: '#E91E63', colors: [
                {name:'E1',hex:'#FDD3CC'},{name:'E2',hex:'#FEC0DF'},{name:'E3',hex:'#FFB7E7'},{name:'E4',hex:'#E8649E'},{name:'E5',hex:'#F551A2'},
                {name:'E6',hex:'#F13D74'},{name:'E7',hex:'#C63478'},{name:'E8',hex:'#FFDBE9'},{name:'E9',hex:'#E970CC'},{name:'E10',hex:'#D33793'},
                {name:'E11',hex:'#FCDDD2'},{name:'E12',hex:'#F78FC3'},{name:'E13',hex:'#B5006D'},{name:'E14',hex:'#FFD1BA'},{name:'E15',hex:'#F8C7C9'},
                {name:'E16',hex:'#FFF3EB'},{name:'E17',hex:'#FFE2EA'},{name:'E18',hex:'#FFC7DB'},{name:'E19',hex:'#FEBAD5'},{name:'E20',hex:'#D8C7D1'},
                {name:'E21',hex:'#BD9DA1'},{name:'E22',hex:'#B785A1'},{name:'E23',hex:'#937A8D'},{name:'E24',hex:'#E1BCE8'}
            ]},
            F: { name: '红色系', icon: 'F', color: '#F44336', colors: [
                {name:'F1',hex:'#FD957B'},{name:'F2',hex:'#FC3D46'},{name:'F3',hex:'#F74941'},{name:'F4',hex:'#FC283C'},{name:'F5',hex:'#E7002F'},
                {name:'F6',hex:'#943630'},{name:'F7',hex:'#971937'},{name:'F8',hex:'#BC0028'},{name:'F9',hex:'#E2677A'},{name:'F10',hex:'#8A4526'},
                {name:'F11',hex:'#5A2121'},{name:'F12',hex:'#FD4E6A'},{name:'F13',hex:'#F35744'},{name:'F14',hex:'#FFA9AD'},{name:'F15',hex:'#D30022'},
                {name:'F16',hex:'#FEC2A6'},{name:'F17',hex:'#E69C79'},{name:'F18',hex:'#D37C46'},{name:'F19',hex:'#C1444A'},{name:'F20',hex:'#CD9391'},
                {name:'F21',hex:'#F7B4C6'},{name:'F22',hex:'#FDC0D0'},{name:'F23',hex:'#F67E66'},{name:'F24',hex:'#E698AA'},{name:'F25',hex:'#E54B4F'}
            ]},
            G: { name: '棕色系', icon: 'G', color: '#795548', colors: [
                {name:'G1',hex:'#FFE2CE'},{name:'G2',hex:'#FFC4AA'},{name:'G3',hex:'#F4C3A5'},{name:'G4',hex:'#E1B383'},{name:'G5',hex:'#EDB045'},
                {name:'G6',hex:'#E99C17'},{name:'G7',hex:'#9D5B3E'},{name:'G8',hex:'#753832'},{name:'G9',hex:'#E6B483'},{name:'G10',hex:'#D98C39'},
                {name:'G11',hex:'#E0C593'},{name:'G12',hex:'#FFC890'},{name:'G13',hex:'#B7714A'},{name:'G14',hex:'#8D614C'},{name:'G15',hex:'#FCF9E0'},
                {name:'G16',hex:'#F2D9BA'},{name:'G17',hex:'#78524B'},{name:'G18',hex:'#FFE4CC'},{name:'G19',hex:'#E07935'},{name:'G20',hex:'#A94023'},
                {name:'G21',hex:'#B88558'}
            ]},
            H: { name: '黑白灰系', icon: 'H', color: '#333333', colors: [
                {name:'H1',hex:'#FDFBFF'},{name:'H2',hex:'#FEFFFF'},{name:'H3',hex:'#B6B1BA'},{name:'H4',hex:'#89858C'},{name:'H5',hex:'#48464E'},
                {name:'H6',hex:'#2F2B2F'},{name:'H7',hex:'#000000'},{name:'H8',hex:'#E7D6DB'},{name:'H9',hex:'#EDEDED'},{name:'H10',hex:'#EEE9EA'},
                {name:'H11',hex:'#CECDD5'},{name:'H12',hex:'#FFF5ED'},{name:'H13',hex:'#F5ECD2'},{name:'H14',hex:'#CFD7D3'},{name:'H15',hex:'#98A6A8'},
                {name:'H16',hex:'#1D1414'},{name:'H17',hex:'#F1EDED'},{name:'H18',hex:'#FFFDF0'},{name:'H19',hex:'#F6EFE2'},{name:'H20',hex:'#949FA3'},
                {name:'H21',hex:'#FFFBE1'},{name:'H22',hex:'#CACAD4'},{name:'H23',hex:'#9A9D94'}
            ]},
            M: { name: '多彩系', icon: 'M', color: '#FF6B6B', colors: [
                {name:'M1',hex:'#BCC6B8'},{name:'M2',hex:'#8AA386'},{name:'M3',hex:'#697D80'},{name:'M4',hex:'#E3D2BC'},{name:'M5',hex:'#D0CCAA'},
                {name:'M6',hex:'#B0A782'},{name:'M7',hex:'#B4A497'},{name:'M8',hex:'#B38281'},{name:'M9',hex:'#A58767'},{name:'M10',hex:'#C5B2BC'},
                {name:'M11',hex:'#9F7594'},{name:'M12',hex:'#644749'},{name:'M13',hex:'#D19066'},{name:'M14',hex:'#C77362'},{name:'M15',hex:'#757D78'}
            ]}
        }
    },
    artkal: {
        name: 'Artkal',
        info: 'Artkal 拼豆以高品质著称，颜色鲜艳持久，是专业玩家的首选品牌。色号最齐全的品牌，176色几乎覆盖所有色调，中文圈最常见。',
        series: {
            S: { name: '标准色系', icon: 'S', color: '#FF0000', colors: [
                {name:'S01',hex:'#FFFFFF'},{name:'S02',hex:'#FFA38B'},{name:'S03',hex:'#FF8200'},{name:'S04',hex:'#FA4616'},{name:'S05',hex:'#EE2737'},
                {name:'S06',hex:'#EF64A2'},{name:'S07',hex:'#97999B'},{name:'S08',hex:'#26D07C'},{name:'S09',hex:'#007371'},{name:'S10',hex:'#56B7E6'},
                {name:'S11',hex:'#0050B5'},{name:'S12',hex:'#9063CD'},{name:'S13',hex:'#000000'},{name:'S14',hex:'#FDDA24'},{name:'S15',hex:'#A72B2A'},
                {name:'S16',hex:'#674736'},{name:'S17',hex:'#7B4D35'},{name:'S18',hex:'#EAA794'},{name:'S19',hex:'#F8C1B8'},{name:'S20',hex:'#249E6B'},
                {name:'S21',hex:'#93C90E'},{name:'S22',hex:'#483698'},{name:'S23',hex:'#7D55C7'},{name:'S24',hex:'#1164C9'},{name:'S25',hex:'#EF60A3'},
                {name:'S26',hex:'#F04E98'},{name:'S27',hex:'#FFC72C'},{name:'S28',hex:'#EF95CF'},{name:'S29',hex:'#FBDB65'},{name:'S30',hex:'#A4E6E8'},
                {name:'S31',hex:'#B5E3D8'},{name:'S32',hex:'#FECB8B'},{name:'S33',hex:'#C5B4E3'},{name:'S34',hex:'#D50032'},{name:'S35',hex:'#F7CED7'},
                {name:'S36',hex:'#E06287'},{name:'S37',hex:'#8BD3E6'},{name:'S38',hex:'#BC204B'},{name:'S39',hex:'#FF7F41'},{name:'S40',hex:'#F99FC9'},
                {name:'S41',hex:'#9A5516'},{name:'S42',hex:'#A09F9D'},{name:'S43',hex:'#75787B'},{name:'S44',hex:'#9BCBEB'},{name:'S45',hex:'#00B2A9'},
                {name:'S46',hex:'#8EDD65'},{name:'S47',hex:'#A6631B'},{name:'S48',hex:'#FFC845'},{name:'S49',hex:'#973961'},{name:'S50',hex:'#FFB3AB'},
                {name:'S51',hex:'#FFF8DB'},{name:'S52',hex:'#F8E08E'},{name:'S53',hex:'#62A0E6'},{name:'S54',hex:'#0090DA'},{name:'S55',hex:'#ADDC91'},
                {name:'S56',hex:'#FF6A39'},{name:'S57',hex:'#B33D26'},{name:'S58',hex:'#BA0C2F'},{name:'S59',hex:'#5949A7'},{name:'S60',hex:'#9678D3'},
                {name:'S61',hex:'#E6DE77'},{name:'S62',hex:'#007C58'},{name:'S63',hex:'#4C5914'},{name:'S64',hex:'#2C2D65'},{name:'S65',hex:'#F0EC74'},
                {name:'S66',hex:'#EE5340'},{name:'S67',hex:'#ECC3B2'},{name:'S68',hex:'#E7B78A'},{name:'S69',hex:'#212721'},{name:'S70',hex:'#BABC16'},
                {name:'S71',hex:'#008522'},{name:'S72',hex:'#67D9DF'},{name:'S73',hex:'#48A9C5'},{name:'S74',hex:'#04A9C7'},{name:'S75',hex:'#0085AD'},
                {name:'S76',hex:'#00A7B5'},{name:'S77',hex:'#D9D9D6'},{name:'S78',hex:'#C8C9C7'},{name:'S79',hex:'#B1B3B3'},{name:'S80',hex:'#A2A569'},
                {name:'S81',hex:'#D5A286'},{name:'S82',hex:'#C58B68'},{name:'S83',hex:'#B15533'},{name:'S84',hex:'#AB5C57'},{name:'S85',hex:'#8A2A2B'},
                {name:'S86',hex:'#F29D04'},{name:'S87',hex:'#FF808B'},{name:'S88',hex:'#DA1884'},{name:'S89',hex:'#53565A'},{name:'S90',hex:'#FFC56E'},
                {name:'S91',hex:'#183028'},{name:'S92',hex:'#C69214'},{name:'S93',hex:'#EDC8A3'},{name:'S94',hex:'#EAA794'},{name:'S95',hex:'#E8927C'},
                {name:'S96',hex:'#FF8D6D'},{name:'S97',hex:'#E35205'},{name:'S98',hex:'#80B6E8'},{name:'S99',hex:'#5CA9CC'},{name:'S100',hex:'#5DB3CB'},
                {name:'S101',hex:'#00A3E1'},{name:'S102',hex:'#0077CF'},{name:'S103',hex:'#0067B9'},{name:'S104',hex:'#007DBA'},{name:'S105',hex:'#00859B'},
                {name:'S106',hex:'#0076A8'},{name:'S107',hex:'#007096'},{name:'S108',hex:'#E6C78A'},{name:'S109',hex:'#CEB888'},{name:'S110',hex:'#C6AA76'},
                {name:'S111',hex:'#A08629'},{name:'S112',hex:'#897630'},{name:'S113',hex:'#C3C6A8'},{name:'S114',hex:'#C0BB87'},{name:'S115',hex:'#B0AA7E'},
                {name:'S116',hex:'#A3AA83'},{name:'S117',hex:'#77744D'},{name:'S118',hex:'#5E6738'},{name:'S119',hex:'#98DBCE'},{name:'S120',hex:'#9BE3BF'},
                {name:'S121',hex:'#6BBBAE'},{name:'S122',hex:'#00BB7E'},{name:'S123',hex:'#31B700'},{name:'S124',hex:'#035F1D'},{name:'S125',hex:'#007864'},
                {name:'S126',hex:'#00685E'},{name:'S127',hex:'#DECDE7'},{name:'S128',hex:'#C98BDB'},{name:'S129',hex:'#DCB6C9'},{name:'S130',hex:'#DD74A1'},
                {name:'S131',hex:'#AD96DC'},{name:'S132',hex:'#EF426F'},{name:'S133',hex:'#C724B1'},{name:'S134',hex:'#8031A7'},{name:'S135',hex:'#9FAEE5'},
                {name:'S136',hex:'#B4B2E4'},{name:'S137',hex:'#5F8DDA'},{name:'S138',hex:'#5780D2'},{name:'S139',hex:'#5576D1'},{name:'S140',hex:'#3C62C3'},
                {name:'S141',hex:'#466CCA'},{name:'S142',hex:'#365ABD'},{name:'S143',hex:'#1E22AA'},{name:'S144',hex:'#002D72'},{name:'S145',hex:'#E9E186'},
                {name:'S146',hex:'#8C243D'},{name:'S147',hex:'#86C8BC'},{name:'S148',hex:'#724736'},{name:'S149',hex:'#FCD299'},{name:'S150',hex:'#8B84D7'},
                {name:'S151',hex:'#335525'},{name:'S152',hex:'#A7A4E0'},{name:'S153',hex:'#C6C4EA'},{name:'S154',hex:'#EBC29D'},{name:'S155',hex:'#C58B68'},
                {name:'S156',hex:'#63666A'},{name:'S157',hex:'#46494C'},{name:'S158',hex:'#191D19'},{name:'S159',hex:'#88888D'}
            ]},
            SE: { name: '扩展色系', icon: 'SE', color: '#8B008B', colors: [
                {name:'SE01',hex:'#D1DDE6'},{name:'SE02',hex:'#9BB8E3'},{name:'SE03',hex:'#5E8AB4'},{name:'SE04',hex:'#6AD1E3'},{name:'SE05',hex:'#03C1AA'},
                {name:'SE06',hex:'#126AD4'},{name:'SE07',hex:'#BFA5B8'},{name:'SE08',hex:'#9B7793'},{name:'SE09',hex:'#693C5E'},{name:'SE10',hex:'#C964CF'},
                {name:'SE11',hex:'#AD1AAC'},{name:'SE12',hex:'#FFB25B'},{name:'SE13',hex:'#E6A65D'},{name:'SE14',hex:'#D38235'},{name:'SE15',hex:'#C16C18'},
                {name:'SE16',hex:'#F5B6CD'},{name:'SE17',hex:'#5D2A2C'}
            ]}
        }
    },
    perler: {
        name: 'Perler',
        info: 'Perler 是源自美国的老牌拼豆品牌，颜色经典，品质稳定。124个色号，覆盖标准色、粉彩、夜光、亮粉、双色等。',
        series: {
            '基础': { name: '基础色系', icon: '基础', color: '#FF0000', colors: [
                {name:'P01',hex:'#F1F1F1'},{name:'P02',hex:'#E0DEA9'},{name:'P03',hex:'#ECD800'},{name:'P04',hex:'#ED6120'},{name:'P05',hex:'#F01820'},
                {name:'P06',hex:'#DD669B'},{name:'P07',hex:'#604089'},{name:'P08',hex:'#2B3F87'},{name:'P09',hex:'#3370C0'},{name:'P10',hex:'#1C753E'},
                {name:'P11',hex:'#56BA9F'},{name:'P12',hex:'#513931'},{name:'P17',hex:'#8A8D91'},{name:'P18',hex:'#2E2F32'}
            ]},
            '扩展': { name: '扩展色系', icon: '扩展', color: '#00FF00', colors: [
                {name:'P20',hex:'#8C372C'},{name:'P21',hex:'#815D34'},{name:'P22',hex:'#BC4C4C'},{name:'P23',hex:'#D67B6C'},{name:'P24',hex:'#E09B8D'},
                {name:'P25',hex:'#E8B4A0'},{name:'P26',hex:'#EDC9B5'},{name:'P27',hex:'#F2DACE'},{name:'P28',hex:'#F7E8DB'},{name:'P29',hex:'#F9EFE6'},
                {name:'P30',hex:'#ECD8C6'},{name:'P31',hex:'#DCCAB0'},{name:'P32',hex:'#CBB69B'},{name:'P33',hex:'#EEBAB2'},{name:'P35',hex:'#BC9371'},
                {name:'P38',hex:'#F22A7B'},{name:'P47',hex:'#DCE002'},{name:'P48',hex:'#FF7700'},{name:'P49',hex:'#019E43'},{name:'P50',hex:'#FF3991'},
                {name:'P52',hex:'#5390D1'},{name:'P53',hex:'#76C882'},{name:'P54',hex:'#8A72C1'},{name:'P56',hex:'#FEF875'},{name:'P57',hex:'#F1AA0C'},
                {name:'P58',hex:'#93C8D4'},{name:'P59',hex:'#FF3851'},{name:'P60',hex:'#A24B9C'},{name:'P61',hex:'#6CBE13'},{name:'P62',hex:'#2B89C6'},
                {name:'P63',hex:'#FF8285'},{name:'P70',hex:'#647CBE'},{name:'P75',hex:'#BEC696'},{name:'P79',hex:'#F6B3DD'},{name:'P80',hex:'#4FAD42'},
                {name:'P81',hex:'#EEE3CF'},{name:'P82',hex:'#AD98D4'},{name:'P83',hex:'#E44892'},{name:'P85',hex:'#BB7634'},{name:'P88',hex:'#A53061'},
                {name:'P89',hex:'#406AE1'},{name:'P90',hex:'#D48437'},{name:'P91',hex:'#067C81'},{name:'P92',hex:'#4D5156'},{name:'P93',hex:'#8297D9'},
                {name:'P96',hex:'#801922'},{name:'P97',hex:'#BDDA01'},{name:'P98',hex:'#E4B690'},{name:'P100',hex:'#F97E79'},{name:'P101',hex:'#7AAEA2'},
                {name:'P102',hex:'#84B791'},{name:'P103',hex:'#CAC033'},{name:'P104',hex:'#D7A8A2'},{name:'P105',hex:'#777B81'},{name:'P179',hex:'#114938'},
                {name:'P181',hex:'#B3BAB8'},{name:'P182',hex:'#AF9FCE'},{name:'P199',hex:'#008F53'},{name:'P200',hex:'#0065B1'},{name:'P201',hex:'#2F3C55'},
                {name:'P202',hex:'#A9CDD5'},{name:'P203',hex:'#F2AFB7'},{name:'P204',hex:'#E1747A'},{name:'P205',hex:'#C9A385'},{name:'P206',hex:'#94A19D'},
                {name:'P207',hex:'#4F595A'},{name:'P208',hex:'#DEDACE'},{name:'P210',hex:'#B1628E'},{name:'P211',hex:'#D14337'},{name:'P212',hex:'#D9593A'},
                {name:'P213',hex:'#F5A168'},{name:'P214',hex:'#D8E47C'},{name:'P215',hex:'#93B0BD'},{name:'P216',hex:'#4AC0D8'},{name:'P217',hex:'#00A4AC'},
                {name:'P218',hex:'#047F8A'},{name:'P219',hex:'#7F971A'},{name:'P220',hex:'#696E31'},{name:'P239',hex:'#C8B693'},{name:'P240',hex:'#B3EED5'},
                {name:'P241',hex:'#A3DE6F'},{name:'P242',hex:'#F479B0'},{name:'P243',hex:'#503B9C'},{name:'P244',hex:'#D25D72'},{name:'P245',hex:'#4E56A3'},
                {name:'P246',hex:'#FD5918'},{name:'P247',hex:'#005D57'},{name:'P248',hex:'#6F3255'},{name:'P249',hex:'#DA8C2C'},{name:'P250',hex:'#7E5446'},
                {name:'P251',hex:'#8C8CA7'},{name:'P252',hex:'#4C6388'},{name:'P253',hex:'#9AA98E'},{name:'P254',hex:'#EFB79B'},{name:'P255',hex:'#CA3B65'},
                {name:'P256',hex:'#CB59B9'},{name:'P257',hex:'#714875'},{name:'P258',hex:'#C8C85C'},{name:'P259',hex:'#988C8C'},{name:'P260',hex:'#14313B'},
                {name:'P261',hex:'#392928'},{name:'P262',hex:'#5E6D7B'},{name:'P263',hex:'#BED4A6'},{name:'P265',hex:'#C685B1'},{name:'P272',hex:'#FF9A8B'},
                {name:'P273',hex:'#FC9574'},{name:'P274',hex:'#F6CA69'},{name:'P275',hex:'#0090AC'},{name:'P276',hex:'#F8C7C9'},{name:'P961',hex:'#9D2B3A'}
            ]}
        }
    },
    hama: {
        name: 'Hama',
        info: 'Hama 是来自瑞典的经典拼豆品牌，以创新设计和丰富颜色闻名。色号精简但稳定，midi/mini/maxi共用同一套编码体系。',
        series: {
            '标准': { name: '标准色系', icon: '标准', color: '#FF0000', colors: [
                {name:'H01',hex:'#ECEDED'},{name:'H02',hex:'#F0E8B9'},{name:'H03',hex:'#F0B901'},{name:'H04',hex:'#E64F27'},{name:'H05',hex:'#B63136'},
                {name:'H06',hex:'#E1889F'},{name:'H07',hex:'#694A82'},{name:'H08',hex:'#2C4690'},{name:'H09',hex:'#305CB0'},{name:'H10',hex:'#256847'},
                {name:'H11',hex:'#49AE89'},{name:'H12',hex:'#534137'},{name:'H13',hex:'#C02435'},{name:'H14',hex:'#E4AA32'},{name:'H15',hex:'#487ED5'},
                {name:'H16',hex:'#37B876'},{name:'H17',hex:'#83888A'},{name:'H18',hex:'#2E2F31'},{name:'H19',hex:'#D8D2CE'},{name:'H20',hex:'#7F332A'},
                {name:'H21',hex:'#A5693F'},{name:'H22',hex:'#A52D36'},{name:'H24',hex:'#683E9A'},{name:'H25',hex:'#87593D'},{name:'H26',hex:'#DE9B90'},
                {name:'H27',hex:'#DEB48B'},{name:'H28',hex:'#363F38'},{name:'H29',hex:'#B9395E'},{name:'H30',hex:'#592F38'},{name:'H31',hex:'#6797AE'},
                {name:'H32',hex:'#FF208D'},{name:'H33',hex:'#FF3956'},{name:'H34',hex:'#E5EF13'},{name:'H35',hex:'#FF2833'},{name:'H36',hex:'#2353B0'},
                {name:'H37',hex:'#06B73C'},{name:'H38',hex:'#FD8600'},{name:'H39',hex:'#F1F21C'},{name:'H40',hex:'#FE630B'},{name:'H41',hex:'#2659B2'},
                {name:'H42',hex:'#0CBD51'},{name:'H43',hex:'#F0EA37'},{name:'H44',hex:'#EE6972'},{name:'H45',hex:'#886DB9'},{name:'H46',hex:'#629ED7'},
                {name:'H47',hex:'#83CB70'},{name:'H48',hex:'#CF70B7'},{name:'H49',hex:'#4998BC'},{name:'H60',hex:'#F49422'},{name:'H61',hex:'#D99350'},
                {name:'H62',hex:'#48474A'},{name:'H63',hex:'#42312F'},{name:'H64',hex:'#EFEBE4'},{name:'H70',hex:'#B6B6D4'},{name:'H71',hex:'#464541'},
                {name:'H72',hex:'#F097B0'},{name:'H73',hex:'#59AEF5'},{name:'H74',hex:'#5B55BD'},{name:'H75',hex:'#BF7B4D'},{name:'H76',hex:'#663317'},
                {name:'H77',hex:'#EDE7DF'},{name:'H78',hex:'#FFC99A'},{name:'H79',hex:'#F08643'},{name:'H82',hex:'#962F5C'},{name:'H83',hex:'#0178A4'},
                {name:'H84',hex:'#8B924C'},{name:'H95',hex:'#F8CCE0'},{name:'H96',hex:'#D4B1E3'},{name:'H97',hex:'#A2D3FE'},{name:'H98',hex:'#9ADBB1'},
                {name:'H101',hex:'#A9C39B'},{name:'H102',hex:'#356B2D'},{name:'H103',hex:'#FFE660'},{name:'H104',hex:'#BCD122'},{name:'H105',hex:'#FFAC78'},{name:'H106',hex:'#CCC5ED'},{name:'H107',hex:'#6A87C1'},{name:'H108',hex:'#2A2536'},{name:'H109',hex:'#8A847F'},{name:'H110',hex:'#838956'},{name:'H111',hex:'#835854'},{name:'H112',hex:'#AD8A82'},{name:'H113',hex:'#5F887B'},{name:'H114',hex:'#9A2C31'},{name:'H115',hex:'#6E975F'},{name:'H116',hex:'#222838'},{name:'H117',hex:'#777169'},{name:'H118',hex:'#612932'},{name:'H119',hex:'#4167B4'}
            ]}
        }
    },
    artkalMini: {
        name: 'Artkal Mini',
        info: 'Artkal Mini 是 2.6mm 小颗豆版本，共 207 色——尺寸是标准 5mm 中豆的一半，适合高精度细节作品和小型周边制作。',
        series: {
            MA: { name: '黄橙系', icon: 'MA', color: '#FFA80C', colors: [
                {name:'MA1',hex:'#FFF6D4'},{name:'MA2',hex:'#F6F9E5'},{name:'MA3',hex:'#FFFBAA'},{name:'MA4',hex:'#FFDF58'},{name:'MA5',hex:'#FECF4D'},
                {name:'MA6',hex:'#FFA80C'},{name:'MA7',hex:'#FF8837'},{name:'MA8',hex:'#EAC431'},{name:'MA9',hex:'#F1AA8F'},{name:'MA10',hex:'#FF8F42'},
                {name:'MA11',hex:'#FFE1A1'},{name:'MA12',hex:'#F4B39C'},{name:'MA13',hex:'#FFB100'},{name:'MA14',hex:'#FF6510'},{name:'MA15',hex:'#DAF05C'},
                {name:'MA16',hex:'#F9FBBE'},{name:'MA17',hex:'#FFD976'},{name:'MA18',hex:'#FFCA9A'},{name:'MA19',hex:'#EC7A92'},{name:'MA20',hex:'#E5BE55'},
                {name:'MA21',hex:'#FFE596'},{name:'MA22',hex:'#F7E898'},{name:'MA23',hex:'#F0CBB1'},{name:'MA24',hex:'#F5FCD1'},{name:'MA25',hex:'#F6D487'},
                {name:'MA26',hex:'#FFCB4B'}
            ]},
            MB: { name: '绿系', icon: 'MB', color: '#5FC873', colors: [
                {name:'MB1',hex:'#D2E318'},{name:'MB2',hex:'#79CD41'},{name:'MB3',hex:'#82D7A1'},{name:'MB4',hex:'#65DF4F'},{name:'MB5',hex:'#5FC873'},
                {name:'MB6',hex:'#49D1AE'},{name:'MB7',hex:'#009696'},{name:'MB8',hex:'#08774F'},{name:'MB9',hex:'#183823'},{name:'MB10',hex:'#83CFC3'},
                {name:'MB11',hex:'#5A6A27'},{name:'MB12',hex:'#045F45'},{name:'MB13',hex:'#E2FFB3'},{name:'MB14',hex:'#9DD12E'},{name:'MB15',hex:'#254B3C'},
                {name:'MB16',hex:'#D0FCAD'},{name:'MB17',hex:'#8CA12A'},{name:'MB18',hex:'#D2D958'},{name:'MB19',hex:'#49BCA9'},{name:'MB20',hex:'#E8FDEC'},
                {name:'MB21',hex:'#188B81'},{name:'MB22',hex:'#0C5C5B'},{name:'MB23',hex:'#3D461B'},{name:'MB24',hex:'#EAFCB6'},{name:'MB25',hex:'#538771'},
                {name:'MB26',hex:'#8A7A40'},{name:'MB27',hex:'#D2DEB6'},{name:'MB28',hex:'#9FF4C2'},{name:'MB29',hex:'#BBD747'},{name:'MB30',hex:'#F5FFE6'},
                {name:'MB31',hex:'#BFE1C2'},{name:'MB32',hex:'#9FBA5C'}
            ]},
            MC: { name: '蓝青系', icon: 'MC', color: '#0588CC', colors: [
                {name:'MC1',hex:'#D5E3DE'},{name:'MC2',hex:'#BBF1F4'},{name:'MC3',hex:'#73C0DF'},{name:'MC4',hex:'#33B3E1'},{name:'MC5',hex:'#00A3CA'},
                {name:'MC6',hex:'#58A0D9'},{name:'MC7',hex:'#0588CC'},{name:'MC8',hex:'#005F9E'},{name:'MC9',hex:'#086FB9'},{name:'MC10',hex:'#52B4E0'},
                {name:'MC11',hex:'#00A9B9'},{name:'MC12',hex:'#1C375A'},{name:'MC13',hex:'#CEE0F0'},{name:'MC14',hex:'#EBF5F4'},{name:'MC15',hex:'#00AAAD'},
                {name:'MC16',hex:'#004C7D'},{name:'MC17',hex:'#5BD4F6'},{name:'MC18',hex:'#36515C'},{name:'MC19',hex:'#0F909D'},{name:'MC20',hex:'#0084B7'},
                {name:'MC21',hex:'#DDECFA'},{name:'MC22',hex:'#84BAC2'},{name:'MC23',hex:'#CBDBDB'},{name:'MC24',hex:'#88BDE2'},{name:'MC25',hex:'#B3ECE0'},
                {name:'MC26',hex:'#3E9EBF'},{name:'MC27',hex:'#E9F0F3'},{name:'MC28',hex:'#C2CDE3'},{name:'MC29',hex:'#586B8F'}
            ]},
            MD: { name: '紫系', icon: 'MD', color: '#7292E2', colors: [
                {name:'MD1',hex:'#7292E2'},{name:'MD2',hex:'#8B6FC6'},{name:'MD3',hex:'#A45EC7'},{name:'MD4',hex:'#9A32B2'},{name:'MD5',hex:'#B90095'},
                {name:'MD6',hex:'#E064C2'},{name:'MD7',hex:'#D84EC8'},{name:'MD8',hex:'#E152C6'},{name:'MD9',hex:'#C724B1'},{name:'MD10',hex:'#251B58'},
                {name:'MD11',hex:'#7A5EAD'},{name:'MD12',hex:'#CF8BBE'},{name:'MD13',hex:'#6B4FA0'},{name:'MD14',hex:'#7B4D8E'},{name:'MD15',hex:'#8F6BA0'},
                {name:'MD16',hex:'#B87CC4'},{name:'MD17',hex:'#D8A6D8'},{name:'MD18',hex:'#C78EC4'},{name:'MD19',hex:'#DCC8E8'},{name:'MD20',hex:'#B460C3'},
                {name:'MD21',hex:'#E0B8E0'},{name:'MD22',hex:'#D8C3D7'},{name:'MD23',hex:'#DEB6E0'},{name:'MD24',hex:'#D5C5E0'},{name:'MD25',hex:'#E8D8F0'},
                {name:'MD26',hex:'#DDC8DD'}
            ]},
            ME: { name: '粉系', icon: 'ME', color: '#F04E98', colors: [
                {name:'ME1',hex:'#FDD6C9'},{name:'ME2',hex:'#FFDBE9'},{name:'ME3',hex:'#FEC0DF'},{name:'ME4',hex:'#FFB7E7'},{name:'ME5',hex:'#F8C7C9'},
                {name:'ME6',hex:'#F78FC3'},{name:'ME7',hex:'#FF9ED2'},{name:'ME8',hex:'#FFD5EC'},{name:'ME9',hex:'#E970CC'},{name:'ME10',hex:'#BE316D'},
                {name:'ME11',hex:'#F4A0BE'},{name:'ME12',hex:'#FFA5C6'},{name:'ME13',hex:'#E8649E'},{name:'ME14',hex:'#F551A2'},{name:'ME15',hex:'#F13D74'},
                {name:'ME16',hex:'#FFD1BA'},{name:'ME17',hex:'#F8C4B8'},{name:'ME18',hex:'#F0A8B8'},{name:'ME19',hex:'#FFD5EC'},{name:'ME20',hex:'#F3DCE8'},
                {name:'ME21',hex:'#BD9CA3'},{name:'ME22',hex:'#C578A5'},{name:'ME23',hex:'#A37A9B'},{name:'ME24',hex:'#F4E8FF'}
            ]},
            MF: { name: '红橙棕系', icon: 'MF', color: '#E35205', colors: [
                {name:'MF1',hex:'#FF7F67'},{name:'MF2',hex:'#FC3D46'},{name:'MF3',hex:'#F74941'},{name:'MF4',hex:'#FC283C'},{name:'MF5',hex:'#E7002F'},
                {name:'MF6',hex:'#D30022'},{name:'MF7',hex:'#FF957B'},{name:'MF8',hex:'#FEC2A6'},{name:'MF9',hex:'#E69C79'},{name:'MF10',hex:'#AB613C'},
                {name:'MF11',hex:'#D37C46'},{name:'MF12',hex:'#C1444A'},{name:'MF13',hex:'#8A4526'},{name:'MF14',hex:'#5A2121'},{name:'MF15',hex:'#971937'},
                {name:'MF16',hex:'#FF8D6D'},{name:'MF17',hex:'#E35205'},{name:'MF18',hex:'#FF6A39'},{name:'MF19',hex:'#C74651'},{name:'MF20',hex:'#D8A89E'},
                {name:'MF21',hex:'#EB9DB9'},{name:'MF22',hex:'#FFD4D4'},{name:'MF23',hex:'#F4B39C'},{name:'MF24',hex:'#F7C1C5'},{name:'MF25',hex:'#FC5768'}
            ]},
            MG: { name: '棕系', icon: 'MG', color: '#8B7D6B', colors: [
                {name:'MG1',hex:'#FFE7C8'},{name:'MG2',hex:'#F5E6D3'},{name:'MG3',hex:'#E8D4C0'},{name:'MG4',hex:'#D4B896'},{name:'MG5',hex:'#EDB045'},
                {name:'MG6',hex:'#D4A04A'},{name:'MG7',hex:'#C58B68'},{name:'MG8',hex:'#A86C4A'},{name:'MG9',hex:'#8B6E4E'},{name:'MG10',hex:'#6B4D3A'},
                {name:'MG11',hex:'#9D5B3E'},{name:'MG12',hex:'#B7714A'},{name:'MG13',hex:'#8A5A3C'},{name:'MG14',hex:'#5E4029'},{name:'MG15',hex:'#3D2E24'},
                {name:'MG16',hex:'#F0AB47'},{name:'MG17',hex:'#D4A54A'},{name:'MG18',hex:'#BF8C6E'},{name:'MG19',hex:'#F0AB47'},{name:'MG20',hex:'#AE6949'},
                {name:'MG21',hex:'#BF8C6E'}
            ]},
            MH: { name: '灰白系', icon: 'MH', color: '#9E9E9E', colors: [
                {name:'MH1',hex:'#FFFFFF'},{name:'MH2',hex:'#F6F6F6'},{name:'MH3',hex:'#EDEBEB'},{name:'MH4',hex:'#E0DEDE'},{name:'MH5',hex:'#D3D3D3'},
                {name:'MH6',hex:'#3A3A3A'},{name:'MH7',hex:'#A8A8A8'},{name:'MH8',hex:'#8E8E8E'},{name:'MH9',hex:'#787878'},{name:'MH10',hex:'#E2E0E7'},
                {name:'MH11',hex:'#484848'},{name:'MH12',hex:'#363636'},{name:'MH13',hex:'#282828'},{name:'MH14',hex:'#1A1A1A'},{name:'MH15',hex:'#99ABAC'},
                {name:'MH16',hex:'#FBF2E4'},{name:'MH17',hex:'#F0EAE0'},{name:'MH18',hex:'#E3DCD0'},{name:'MH19',hex:'#FBF2E4'},{name:'MH20',hex:'#9EAEAD'},
                {name:'MH21',hex:'#C8CACA'},{name:'MH22',hex:'#EDEDE7'},{name:'MH23',hex:'#B4B8A7'},{name:'MH24',hex:'#9EAEAD'}
            ]}
        }
    }
};