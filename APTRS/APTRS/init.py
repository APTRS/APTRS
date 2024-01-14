
VERSION = '1.0'
BANNER = """

 █████╗ ██████╗ ████████╗██████╗ ███████╗    ██╗   ██╗ ██╗    ██████╗ 
██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗██╔════╝    ██║   ██║███║   ██╔═████╗
███████║██████╔╝   ██║   ██████╔╝███████╗    ██║   ██║╚██║   ██║██╔██║
██╔══██║██╔═══╝    ██║   ██╔══██╗╚════██║    ╚██╗ ██╔╝ ██║   ████╔╝██║
██║  ██║██║        ██║   ██║  ██║███████║     ╚████╔╝  ██║██╗╚██████╔╝
╚═╝  ╚═╝╚═╝        ╚═╝   ╚═╝  ╚═╝╚══════╝      ╚═══╝   ╚═╝╚═╝ ╚═════╝                                                                                                         
"""

RED = '\033[91m'
RESET = '\033[0m'
GREEN = '\033[92m'
# Apply colors to the banner text
BANNER = f"{RED}{BANNER}{RESET}"
COPYRIGHT = "\tv" +VERSION+" © Sourav Kalal Aka AnoF-Cyber"+"\n\t"+"https://github.com/Anof-cyber/APTRS"
COPYRIGHT = f"{GREEN}{COPYRIGHT}{RESET}"

def current_version():
    return BANNER, COPYRIGHT
