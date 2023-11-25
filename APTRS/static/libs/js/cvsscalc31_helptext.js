/* Copyright (c) 2019, FIRST.ORG, INC.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
 * following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
 *    disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
 *    following disclaimer in the documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote
 *    products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var CVSS31_Help = {};

// This object is used as an associative array mapping the names of elements on the web page to help text that is
// added as title text. Browsers will display the text when the element is hovered over with the cursor.

/* 
 *
 * Changelog
 *
 * 2020-09-29  Masato Terada  Initial release CVSS31_Help.helpText_ja for CVSS 3.1.
 *
 */

CVSS31_Help.helpText_en = {
  "baseMetricGroup_Legend" : "The Base Metric group represents the intrinsic  characteristics of a vulnerability that are constant over time and across user environments. Determine the vulnerable component and score Attack Vector, Attack Complexity, Privileges Required and User Interaction relative to this.",

  "AV_Heading" : "This metric reflects the context by which vulnerability exploitation is possible. The Base Score increases the more remote (logically, and physically) an attacker can be in order to exploit the vulnerable component.",
  "AV_N_Label" : "The vulnerable component is bound to the network stack and the set of possible attackers extends beyond the other options listed, up to and including the entire Internet. Such a vulnerability is often termed 'remotely exploitable' and can be thought of as an attack being exploitable at the protocol level one or more network hops away (e.g., across one or more routers).",
  "AV_A_Label" : "The vulnerable component is bound to the network stack, but the attack is limited at the protocol level to a logically adjacent topology. This can mean an attack must be launched from the same shared physical (e.g., Bluetooth or IEEE 802.11) or logical (e.g., local IP subnet) network, or from within a secure or otherwise limited administrative domain (e.g., MPLS, secure VPN to an administrative network zone).",
  "AV_L_Label" : "The vulnerable component is not bound to the network stack and the attacker’s path is via read/write/execute capabilities. Either: the attacker exploits the vulnerability by accessing the target system locally (e.g., keyboard, console), or remotely (e.g., SSH); or the attacker relies on User Interaction by another person to perform actions required to exploit the vulnerability (e.g., tricking a legitimate user into opening a malicious document).",
  "AV_P_Label" : "The attack requires the attacker to physically touch or manipulate the vulnerable component. Physical interaction may be brief or persistent.",

  "AC_Heading" : "This metric describes the conditions beyond the attacker’s control that must exist in order to exploit the vulnerability. Such conditions may require the collection of more information about the target or computational exceptions. The assessment of this metric excludes any requirements for user interaction in order to exploit the vulnerability. If a specific configuration is required for an attack to succeed, the Base metrics should be scored assuming the vulnerable component is in that configuration.",
  "AC_L_Label" : "Specialized access conditions or extenuating circumstances do not exist. An attacker can expect repeatable success against the vulnerable component.",
  "AC_H_Label" : "A successful attack depends on conditions beyond the attacker's control. That is, a successful attack cannot be accomplished at will, but requires the attacker to invest in some measurable amount of effort in preparation or execution against the vulnerable component before a successful attack can be expected. For example, a successful attack may require an attacker to: gather knowledge about the environment in which the vulnerable target/component exists; prepare the target environment to improve exploit reliability; or inject themselves into the logical network path between the target and the resource requested by the victim in order to read and/or modify network communications (e.g., a man in the middle attack).",

  "PR_Heading" : "This metric describes the level of privileges an attacker must possess before successfully exploiting the vulnerability.",
  "PR_N_Label" : "The attacker is unauthorized prior to attack, and therefore does not require any access to settings or files to carry out an attack.",
  "PR_L_Label" : "The attacker is authorized with (i.e., requires) privileges that provide basic user capabilities that could normally affect only settings and files owned by a user. Alternatively, an attacker with Low privileges may have the ability to cause an impact only to non-sensitive resources.",
  "PR_H_Label" : "The attacker is authorized with (i.e., requires) privileges that provide significant (e.g., administrative) control over the vulnerable component that could affect component-wide settings and files.",

  "UI_Heading" : "This metric captures the requirement for a user, other than the attacker, to participate in the successful compromise the vulnerable component. This metric determines whether the vulnerability can be exploited solely at the will of the attacker, or whether a separate user (or user-initiated process) must participate in some manner.",
  "UI_N_Label" : "The vulnerable system can be exploited without any interaction from any user.",
  "UI_R_Label" : "Successful exploitation of this vulnerability requires a user to take some action before the vulnerability can be exploited.",

  "S_Heading" : "Does a successful attack impact a component other than the vulnerable component? If so, the Base Score increases and the Confidentiality, Integrity and Authentication metrics should be scored relative to the impacted component.",
  "S_U_Label" : "An exploited vulnerability can only affect resources managed by the same security authority. In this case, the vulnerable component and the impacted component are either the same, or both are managed by the same security authority.",
  "S_C_Label" : "An exploited vulnerability can affect resources beyond the security scope managed by the security authority of the vulnerable component. In this case, the vulnerable component and the impacted component are different and managed by different security authorities.",

  "C_Heading" : "This metric measures the impact to the confidentiality of the information resources managed by a software component due to a successfully exploited vulnerability. Confidentiality refers to limiting information access and disclosure to only authorized users, as well as preventing access by, or disclosure to, unauthorized ones.",
  "C_N_Label" : "There is no loss of confidentiality within the impacted component.",
  "C_L_Label" : "There is some loss of confidentiality. Access to some restricted information is obtained, but the attacker does not have control over what information is obtained, or the amount or kind of loss is limited. The information disclosure does not cause a direct, serious loss to the impacted component.",
  "C_H_Label" : "There is total loss of confidentiality, resulting in all resources within the impacted component being divulged to the attacker. Alternatively, access to only some restricted information is obtained, but the disclosed information presents a direct, serious impact.",

  "I_Heading" : "This metric measures the impact to integrity of a successfully exploited vulnerability. Integrity refers to the trustworthiness and veracity of information.",
  "I_N_Label" : "There is no loss of integrity within the impacted component.",
  "I_L_Label" : "Modification of data is possible, but the attacker does not have control over the consequence of a modification, or the amount of modification is limited. The data modification does not have a direct, serious impact on the impacted component.",
  "I_H_Label" : "There is a total loss of integrity, or a complete loss of protection. For example, the attacker is able to modify any/all files protected by the impacted component. Alternatively, only some files can be modified, but malicious modification would present a direct, serious consequence to the impacted component.",

  "A_Heading" : "This metric measures the impact to the availability of the impacted component resulting from a successfully exploited vulnerability. It refers to the loss of availability of the impacted component itself, such as a networked service (e.g., web, database, email). Since availability refers to the accessibility of information resources, attacks that consume network bandwidth, processor cycles, or disk space all impact the availability of an impacted component.",
  "A_N_Label" : "There is no impact to availability within the impacted component.",
  "A_L_Label" : "Performance is reduced or there are interruptions in resource availability. Even if repeated exploitation of the vulnerability is possible, the attacker does not have the ability to completely deny service to legitimate users. The resources in the impacted component are either partially available all of the time, or fully available only some of the time, but overall there is no direct, serious consequence to the impacted component.",
  "A_H_Label" : "There is total loss of availability, resulting in the attacker being able to fully deny access to resources in the impacted component; this loss is either sustained (while the attacker continues to deliver the attack) or persistent (the condition persists even after the attack has completed). Alternatively, the attacker has the ability to deny some availability, but the loss of availability presents a direct, serious consequence to the impacted component (e.g., the attacker cannot disrupt existing connections, but can prevent new connections; the attacker can repeatedly exploit a vulnerability that, in each instance of a successful attack, leaks a only small amount of memory, but after repeated exploitation causes a service to become completely unavailable).",

  "temporalMetricGroup_Legend" : "The Temporal metrics measure the current state of exploit techniques or code availability, the existence of any patches or workarounds, or the confidence that one has in the description of a vulnerability.",

  "E_Heading" : "This metric measures the likelihood of the vulnerability being attacked, and is typically based on the current state of exploit techniques, exploit code availability, or active, 'in-the-wild' exploitation.",
  "E_X_Label" : "Assigning this value indicates there is insufficient information to choose one of the other values, and has no impact on the overall Temporal Score, i.e., it has the same effect on scoring as assigning High.",
  "E_U_Label" : "No exploit code is available, or an exploit is theoretical.",
  "E_P_Label" : "Proof-of-concept exploit code is available, or an attack demonstration is not practical for most systems. The code or technique is not functional in all situations and may require substantial modification by a skilled attacker.",
  "E_F_Label" : "Functional exploit code is available. The code works in most situations where the vulnerability exists.",
  "E_H_Label" : "Functional autonomous code exists, or no exploit is required (manual trigger) and details are widely available. Exploit code works in every situation, or is actively being delivered via an autonomous agent (such as a worm or virus). Network-connected systems are likely to encounter scanning or exploitation attempts. Exploit development has reached the level of reliable, widely-available, easy-to-use automated tools.",

  "RL_Heading" : "The Remediation Level of a vulnerability is an important factor for prioritization. The typical vulnerability is unpatched when initially published. Workarounds or hotfixes may offer interim remediation until an official patch or upgrade is issued. Each of these respective stages adjusts the temporal score downwards, reflecting the decreasing urgency as remediation becomes final.",
  "RL_X_Label" : "Assigning this value indicates there is insufficient information to choose one of the other values, and has no impact on the overall Temporal Score, i.e., it has the same effect on scoring as assigning Unavailable.",
  "RL_O_Label" : "A complete vendor solution is available. Either the vendor has issued an official patch, or an upgrade is available.",
  "RL_T_Label" : "There is an official but temporary fix available. This includes instances where the vendor issues a temporary hotfix, tool, or workaround.",
  "RL_W_Label" : "There is an unofficial, non-vendor solution available. In some cases, users of the affected technology will create a patch of their own or provide steps to work around or otherwise mitigate the vulnerability.",
  "RL_U_Label" : "There is either no solution available or it is impossible to apply.",

  "RC_Heading" : "This metric measures the degree of confidence in the existence of the vulnerability and the credibility of the known technical details. Sometimes only the existence of vulnerabilities are publicized, but without specific details. For example, an impact may be recognized as undesirable, but the root cause may not be known. The vulnerability may later be corroborated by research which suggests where the vulnerability may lie, though the research may not be certain. Finally, a vulnerability may be confirmed through acknowledgement by the author or vendor of the affected technology. The urgency of a vulnerability is higher when a vulnerability is known to exist with certainty. This metric also suggests the level of technical knowledge available to would-be attackers.",
  "RC_X_Label" : "Assigning this value indicates there is insufficient information to choose one of the other values, and has no impact on the overall Temporal Score, i.e., it has the same effect on scoring as assigning Confirmed.",
  "RC_U_Label" : "There are reports of impacts that indicate a vulnerability is present. The reports indicate that the cause of the vulnerability is unknown, or reports may differ on the cause or impacts of the vulnerability. Reporters are uncertain of the true nature of the vulnerability, and there is little confidence in the validity of the reports or whether a static Base score can be applied given the differences described. An example is a bug report which notes that an intermittent but non-reproducible crash occurs, with evidence of memory corruption suggesting that denial of service, or possible more serious impacts, may result.",
  "RC_R_Label" : "Significant details are published, but researchers either do not have full confidence in the root cause, or do not have access to source code to fully confirm all of the interactions that may lead to the result. Reasonable confidence exists, however, that the bug is reproducible and at least one impact is able to be verified (Proof-of-concept exploits may provide this). An example is a detailed write-up of research into a vulnerability with an explanation (possibly obfuscated or 'left as an exercise to the reader') that gives assurances on how to reproduce the results.",
  "RC_C_Label" : "Detailed reports exist, or functional reproduction is possible (functional exploits may provide this). Source code is available to independently verify the assertions of the research, or the author or vendor of the affected code has confirmed the presence of the vulnerability.",

  "environmentalMetricGroup_Legend" : "These metrics enable the analyst to customize the CVSS score depending on the importance of the affected IT asset to a user’s organization, measured in terms of complementary/alternative security controls in place, Confidentiality, Integrity, and Availability. The metrics are the modified equivalent of base metrics and are assigned metric values based on the component placement in organization infrastructure.",

  "CR_Heading" : "These metrics enable the analyst to customize the CVSS score depending on the importance of the Confidentiality of the affected IT asset to a user’s organization, relative to other impacts. This metric modifies the environmental score by reweighting the Modified Confidentiality impact metric versus the other modified impacts.",
  "CR_X_Label" : "Assigning this value indicates there is insufficient information to choose one of the other values, and has no impact on the overall Environmental Score, i.e., it has the same effect on scoring as assigning Medium.",
  "CR_L_Label" : "Loss of Confidentiality is likely to have only a limited adverse effect on the organization or individuals associated with the organization (e.g., employees, customers).",
  "CR_M_Label" : "Assigning this value to the metric will not influence the score.",
  "CR_H_Label" : "Loss of Confidentiality is likely to have a catastrophic adverse effect on the organization or individuals associated with the organization (e.g., employees, customers).",

  "IR_Heading" : "These metrics enable the analyst to customize the CVSS score depending on the importance of the Integrity of the affected IT asset to a user’s organization, relative to other impacts. This metric modifies the environmental score by reweighting the Modified Integrity impact metric versus the other modified impacts.",
  "IR_X_Label" : "Assigning this value indicates there is insufficient information to choose one of the other values, and has no impact on the overall Environmental Score, i.e., it has the same effect on scoring as assigning Medium.",
  "IR_L_Label" : "Loss of Integrity is likely to have only a limited adverse effect on the organization or individuals associated with the organization (e.g., employees, customers).",
  "IR_M_Label" : "Assigning this value to the metric will not influence the score.",
  "IR_H_Label" : "Loss of Integrity is likely to have a catastrophic adverse effect on the organization or individuals associated with the organization (e.g., employees, customers).",

  "AR_Heading" : "These metrics enable the analyst to customize the CVSS score depending on the importance of the Availability of the affected IT asset to a user’s organization, relative to other impacts. This metric modifies the environmental score by reweighting the Modified Availability impact metric versus the other modified impacts.",
  "AR_X_Label" : "Assigning this value indicates there is insufficient information to choose one of the other values, and has no impact on the overall Environmental Score, i.e., it has the same effect on scoring as assigning Medium.",
  "AR_L_Label" : "Loss of Availability is likely to have only a limited adverse effect on the organization or individuals associated with the organization (e.g., employees, customers).",
  "AR_M_Label" : "Assigning this value to the metric will not influence the score.",
  "AR_H_Label" : "Loss of Availability is likely to have a catastrophic adverse effect on the organization or individuals associated with the organization (e.g., employees, customers).",

  // All the following text should be copied exactly from the Base Score metrics (above), except that
  // "Not Defined (X)" values need to be added for each metric.

  "MAV_Heading" : "This metric reflects the context by which vulnerability exploitation is possible. The Environmental Score increases the more remote (logically, and physically) an attacker can be in order to exploit the vulnerable component.",
  "MAV_X_Label" : "The value assigned to the corresponding Base metric is used.",
  "MAV_N_Label" : "The vulnerable component is bound to the network stack and the set of possible attackers extends beyond the other options listed, up to and including the entire Internet. Such a vulnerability is often termed 'remotely exploitable' and can be thought of as an attack being exploitable at the protocol level one or more network hops away.",
  "MAV_A_Label" : "The vulnerable component is bound to the network stack, but the attack is limited at the protocol level to a logically adjacent topology. This can mean an attack must be launched from the same shared physical (e.g., Bluetooth or IEEE 802.11) or logical (e.g., local IP subnet) network, or from within a secure or otherwise limited administrative domain (e.g., MPLS, secure VPN).",
  "MAV_L_Label" : "The vulnerable component is not bound to the network stack and the attacker’s path is via read/write/execute capabilities. Either: the attacker exploits the vulnerability by accessing the target system locally (e.g., keyboard, console), or remotely (e.g., SSH); or the attacker relies on User Interaction by another person to perform actions required to exploit the vulnerability (e.g., tricking a legitimate user into opening a malicious document).",
  "MAV_P_Label" : "The attack requires the attacker to physically touch or manipulate the vulnerable component. Physical interaction may be brief or persistent.",

  "MAC_Heading" : "This metric describes the conditions beyond the attacker’s control that must exist in order to exploit the vulnerability. Such conditions may require the collection of more information about the target or computational exceptions. The assessment of this metric excludes any requirements for user interaction in order to exploit the vulnerability. If a specific configuration is required for an attack to succeed, the Base metrics should be scored assuming the vulnerable component is in that configuration.",
  "MAC_X_Label" : "The value assigned to the corresponding Base metric is used.",
  "MAC_L_Label" : "Specialized access conditions or extenuating circumstances do not exist. An attacker can expect repeatable success against the vulnerable component.",
  "MAC_H_Label" : "A successful attack depends on conditions beyond the attacker's control. That is, a successful attack cannot be accomplished at will, but requires the attacker to invest in some measurable amount of effort in preparation or execution against the vulnerable component before a successful attack can be expected. For example, a successful attack may require an attacker to: gather knowledge about the environment in which the vulnerable target/component exists; prepare the target environment to improve exploit reliability; or inject themselves into the logical network path between the target and the resource requested by the victim in order to read and/or modify network communications (e.g., a man in the middle attack).",

  "MPR_Heading" : "This metric describes the level of privileges an attacker must possess before successfully exploiting the vulnerability.",
  "MPR_X_Label" : "The value assigned to the corresponding Base metric is used.",
  "MPR_N_Label" : "The attacker is unauthorized prior to attack, and therefore does not require any access to settings or files to carry out an attack.",
  "MPR_L_Label" : "The attacker is authorized with (i.e., requires) privileges that provide basic user capabilities that could normally affect only settings and files owned by a user. Alternatively, an attacker with Low privileges may have the ability to cause an impact only to non-sensitive resources.",
  "MPR_H_Label" : "The attacker is authorized with (i.e., requires) privileges that provide significant (e.g., administrative) control over the vulnerable component that could affect component-wide settings and files.",

  "MUI_Heading" : "This metric captures the requirement for a user, other than the attacker, to participate in the successful compromise the vulnerable component. This metric determines whether the vulnerability can be exploited solely at the will of the attacker, or whether a separate user (or user-initiated process) must participate in some manner.",
  "MUI_X_Label" : "The value assigned to the corresponding Base metric is used.",
  "MUI_N_Label" : "The vulnerable system can be exploited without any interaction from any user.",
  "MUI_R_Label" : "Successful exploitation of this vulnerability requires a user to take some action before the vulnerability can be exploited.",

  "MS_Heading" : "Does a successful attack impact a component other than the vulnerable component? If so, the Base Score increases and the Confidentiality, Integrity and Authentication metrics should be scored relative to the impacted component.",
  "MS_X_Label" : "The value assigned to the corresponding Base metric is used.",
  "MS_U_Label" : "An exploited vulnerability can only affect resources managed by the same security authority. In this case, the vulnerable component and the impacted component are either the same, or both are managed by the same security authority.",
  "MS_C_Label" : "An exploited vulnerability can affect resources beyond the security scope managed by the security authority of the vulnerable component. In this case, the vulnerable component and the impacted component are different and managed by different security authorities.",

  "MC_Heading" : "This metric measures the impact to the confidentiality of the information resources managed by a software component due to a successfully exploited vulnerability. Confidentiality refers to limiting information access and disclosure to only authorized users, as well as preventing access by, or disclosure to, unauthorized ones.",
  "MC_X_Label" : "The value assigned to the corresponding Base metric is used.",
  "MC_N_Label" : "There is no loss of confidentiality within the impacted component.",
  "MC_L_Label" : "There is some loss of confidentiality. Access to some restricted information is obtained, but the attacker does not have control over what information is obtained, or the amount or kind of loss is limited. The information disclosure does not cause a direct, serious loss to the impacted component.",
  "MC_H_Label" : "There is total loss of confidentiality, resulting in all resources within the impacted component being divulged to the attacker. Alternatively, access to only some restricted information is obtained, but the disclosed information presents a direct, serious impact.",

  "MI_Heading" : "This metric measures the impact to integrity of a successfully exploited vulnerability. Integrity refers to the trustworthiness and veracity of information.",
  "MI_X_Label" : "The value assigned to the corresponding Base metric is used.",
  "MI_N_Label" : "There is no loss of integrity within the impacted component.",
  "MI_L_Label" : "Modification of data is possible, but the attacker does not have control over the consequence of a modification, or the amount of modification is limited. The data modification does not have a direct, serious impact on the impacted component.",
  "MI_H_Label" : "There is a total loss of integrity, or a complete loss of protection. For example, the attacker is able to modify any/all files protected by the impacted component. Alternatively, only some files can be modified, but malicious modification would present a direct, serious consequence to the impacted component.",

  "MA_Heading" : "This metric measures the impact to the availability of the impacted component resulting from a successfully exploited vulnerability. It refers to the loss of availability of the impacted component itself, such as a networked service (e.g., web, database, email). Since availability refers to the accessibility of information resources, attacks that consume network bandwidth, processor cycles, or disk space all impact the availability of an impacted component.",
  "MA_X_Label" : "The value assigned to the corresponding Base metric is used.",
  "MA_N_Label" : "There is no impact to availability within the impacted component.",
  "MA_L_Label" : "Performance is reduced or there are interruptions in resource availability. Even if repeated exploitation of the vulnerability is possible, the attacker does not have the ability to completely deny service to legitimate users. The resources in the impacted component are either partially available all of the time, or fully available only some of the time, but overall there is no direct, serious consequence to the impacted component.",
  "MA_H_Label" : "There is total loss of availability, resulting in the attacker being able to fully deny access to resources in the impacted component; this loss is either sustained (while the attacker continues to deliver the attack) or persistent (the condition persists even after the attack has completed). Alternatively, the attacker has the ability to deny some availability, but the loss of availability presents a direct, serious consequence to the impacted component (e.g., the attacker cannot disrupt existing connections, but can prevent new connections; the attacker can repeatedly exploit a vulnerability that, in each instance of a successful attack, leaks a only small amount of memory, but after repeated exploitation causes a service to become completely unavailable)."
};

CVSS31_Help.helpText_ja = { 
  "baseMetricGroup_Legend" : "a脆弱性そのものの特性を評価する基準です。情報システムに求められる3つのセキュリティ特性、『機密性(Confidentiality Impact)」、『完全性(Integrity Impact)」、『可用性(Availability Impact)」に対する影響を、ネットワークから攻撃可能かどうかといった基準で評価し、CVSS基本値(Base Score)を算出します。この基準による評価結果は固定していて、時間の経過や利用環境の異なりによって変化しません。ベンダーや脆弱性を公表する組織などが、脆弱性の固有の深刻度を表すために評価する基準です。",

  "AV_Heading" : "脆弱性のあるコンポーネントをどこから攻撃可能であるかを評価します。",
  "AV_N_Label" : "対象コンポーネントをネットワーク経由でリモートから攻撃可能である。例えば、インターネットからの攻撃など",
  "AV_A_Label" : "対象コンポーネントを隣接ネットワークから攻撃する必要がある。例えば、ローカルIPサブネット、ブルートゥース、IEEE 802.11など",
  "AV_L_Label" : "対象コンポーネントをローカル環境から攻撃する必要がある。例えば、ローカルアクセス権限での攻撃が必要、ワープロのアプリケーションに不正なファイルを読み込ませる攻撃が必要など",
  "AV_P_Label" : "対象コンポーネントを物理アクセス環境から攻撃する必要がある。例えば、IEEE 1394、USB経由で攻撃が必要など",

  "AC_Heading" : "脆弱性のあるコンポーネントを攻撃する際に必要な条件の複雑さを評価します。",
  "AC_L_Label" : "特別な攻撃条件を必要とせず、対象コンポーネントを常に攻撃可能である。",
  "AC_H_Label" : "攻撃者以外に依存する攻撃条件が存在する。例えば、次のいずれかの条件に合致する場合などが該当する。攻撃者は、設定情報、シーケンス番号、共有鍵など、攻撃対象の情報収集が事前に必要となる。攻撃者は、競合が発生する条件、ヒープスプレイを成功させるための条件など、攻撃を成功させるための環境条件を明らかにする必要がある。攻撃者は、中間者攻撃のため環境が必要となる。",

  "PR_Heading" : "脆弱性のあるコンポーネントを攻撃する際に必要な特権のレベルを評価します。",
  "PR_N_Label" : "特別な権限を有する必要はない。",
  "PR_L_Label" : "コンポーネントに対する基本的な権限を有していれば良い。例えば、秘密情報以外にアクセスできるなど",
  "PR_H_Label" : "コンポーネントに対する管理者権限相当を有する必要がある。例えば、秘密情報にアクセスできるなど",

  "UI_Heading" : "脆弱性のあるコンポーネントを攻撃する際に必要なユーザ関与レベルを評価します。",
  "UI_N_Label" : "ユーザが何もしなくても脆弱性が攻撃される可能性がある。",
  "UI_R_Label" : "リンクのクリック、ファイル閲覧、設定の変更など、ユーザ動作が必要である。",

  "S_Heading" : "脆弱性のあるコンポーネントへの攻撃による影響範囲を評価します。",
  "S_U_Label" : "影響範囲が脆弱性のあるコンポーネントの帰属するオーソリゼーションスコープに留まる。",
  "S_C_Label" : "影響範囲が脆弱性のあるコンポーネントの帰属するオーソリゼーションスコープ以外にも広がる可能性がある。例えば、クロスサイトスクリプティング、リフレクター攻撃に悪用される可能性のある脆弱性など",

  "C_Heading" : "脆弱性を攻撃された際に、対象とする影響想定範囲の情報が漏えいする可能性を評価します。",
  "C_N_Label" : "機密性への影響はない",
  "C_L_Label" : "情報漏えいやアクセス制限の回避などが発生はするが、その問題による影響が限定的である。",
  "C_H_Label" : "機密情報や重要なシステムファイルが参照可能であり、その問題による影響が全体に及ぶ。",

  "I_Heading" : "脆弱性を攻撃された際に、対象とする影響想定範囲の情報が改ざんされる可能性を評価します。",
  "I_N_Label" : "完全性への影響はない",
  "I_L_Label" : "情報の改ざんが可能ではあるが、機密情報や重要なシステムファイルの改ざんはできないために、その問題による影響が限定的である。",
  "I_H_Label" : "機密情報や重要なシステムファイルの改ざんが可能で、その問題による影響が全体に及ぶ。",

  "A_Heading" : "脆弱性を攻撃された際に、対象とする影響想定範囲の業務が遅延・停止する可能性を評価します。",
  "A_N_Label" : "可用性への影響はない",
  "A_L_Label" : "リソースを一時的に枯渇させたり、業務の遅延や一時中断が可能である。",
  "A_H_Label" : "リソース(ネットワーク帯域、プロセッサ処理、ディスクスペースなど)を完全に枯渇させたり、完全に停止させることが可能である。",

  "temporalMetricGroup_Legend" : "脆弱性の現在の深刻度を評価する基準です。攻撃コードの出現有無や対策情報が利用可能であるかといった基準で評価し、CVSS現状値(Temporal Score)を算出します。この基準による評価結果は、脆弱性への対応状況に応じ、時間が経過すると変化します。ベンダーや脆弱性を公表する組織などが、脆弱性の現状を表すために評価する基準です。",

  "E_Heading" : "攻撃コードや攻撃手法が実際に利用可能であるかを評価します。",
  "E_X_Label" : "この項目を評価しない。",
  "E_U_Label" : "実証コードや攻撃コードが利用可能でない。攻撃手法が理論上のみで存在している。",
  "E_P_Label" : "実証コードが存在している。完成度の低い攻撃コードが存在している。",
  "E_F_Label" : "攻撃コードが存在し、ほとんどの状況で使用可能である。",
  "E_H_Label" : "攻撃コードがいかなる状況でも利用可能である。攻撃コードを必要とせず、攻撃可能である。",

  "RL_Heading" : "脆弱性の対策がどの程度利用可能であるかを評価します。",
  "RL_X_Label" : "この項目を評価しない。",
  "RL_O_Label" : "製品開発者からの正式対策が利用可能である。",
  "RL_T_Label" : "製品開発者からの暫定対策が利用可能である。",
  "RL_W_Label" : "製品開発者以外からの非公式な対策が利用可能である。",
  "RL_U_Label" : "利用可能な対策がない。対策を適用できない。",

  "RC_Heading" : "脆弱性に関する情報の信頼性を評価します。",
  "RC_X_Label" : "この項目を評価しない。",
  "RC_U_Label" : "未確認の情報のみ存在している。いくつかの相反する情報が存在している。",
  "RC_R_Label" : "セキュリティベンダーや調査団体から、複数の非公式情報が存在している。ソースコードレベルで脆弱性の存在が確認できていない。脆弱性の原因や検証が十分ではない。",
  "RC_C_Label" : "製品開発者が脆弱性情報を確認している。ソースコードレベルで脆弱性の存在を確認されている。脆弱性情報が実証コードや攻撃コードなどにより広範囲に確認されている。",

  "environmentalMetricGroup_Legend" : "ユーザの利用環境も含め、最終的な脆弱性の深刻度を評価する基準です。脆弱性の対処状況を評価し、CVSS環境値(Environmental Score)を算出します。この基準による評価結果は、脆弱性に対して想定される脅威に応じ、ユーザ毎に変化します。ユーザが脆弱性への対応を決めるために評価する基準です。",

  "CR_Heading" : "対象システムが要求されるセキュリティ特性に関して、機密性(C)を重視する場合、その該当項目を高く評価します。",
  "CR_X_Label" : "この項目を評価しない",
  "CR_L_Label" : "対象システムの該当項目を失われても、一部の影響にとどまる",
  "CR_M_Label" : "対象システムの該当項目を失われると、深刻な影響がある。",
  "CR_H_Label" : "対象システムの該当項目を失われると、壊滅的な影響がある。",

  "IR_Heading" : "対象システムが要求されるセキュリティ特性に関して、完全性(I)を重視する場合、その該当項目を高く評価します。",
  "IR_X_Label" : "この項目を評価しない",
  "IR_L_Label" : "対象システムの該当項目を失われても、一部の影響にとどまる",
  "IR_M_Label" : "対象システムの該当項目を失われると、深刻な影響がある。",
  "IR_H_Label" : "対象システムの該当項目を失われると、壊滅的な影響がある。",

  "AR_Heading" : "対象システムが要求されるセキュリティ特性に関して、可用性(A)を重視する場合、その該当項目を高く評価します。",
  "AR_X_Label" : "この項目を評価しない",
  "AR_L_Label" : "対象システムの該当項目を失われても、一部の影響にとどまる",
  "AR_M_Label" : "対象システムの該当項目を失われると、深刻な影響がある。",
  "AR_H_Label" : "対象システムの該当項目を失われると、壊滅的な影響がある。",

  // All the following text should be copied exactly from the Base Score metrics (above), except that
  // "Not Defined (X)" values need to be added.
  "MAV_Heading" : "脆弱性のあるコンポーネントをどこから攻撃可能であるかを再評価します。",
  "MAV_X_Label" : "この項目を評価しない。",
  "MAV_N_Label" : "対象コンポーネントをネットワーク経由でリモートから攻撃可能である。",
  "MAV_A_Label" : "対象コンポーネントを隣接ネットワークから攻撃する必要がある。",
  "MAV_L_Label" : "対象コンポーネントをローカル環境から攻撃する必要がある。",
  "MAV_P_Label" : "対象コンポーネントを物理アクセス環境から攻撃する必要がある。",

  "MAC_Heading" : "脆弱性のあるコンポーネントを攻撃する際に必要な条件の複雑さを再評価します。",
  "MAC_X_Label" : "この項目を評価しない。",
  "MAC_L_Label" : "特別な攻撃条件を必要とせず、対象コンポーネントを常に攻撃可能である。",
  "MAC_H_Label" : "攻撃者以外に依存する攻撃条件が存在する。",

  "MPR_Heading" : "脆弱性のあるコンポーネントを攻撃する際に必要な特権のレベルを再評価します。",
  "MPR_X_Label" : "この項目を評価しない。",
  "MPR_N_Label" : "特別な権限を有する必要はない。",
  "MPR_L_Label" : "コンポーネントに対する基本的な権限を有していれば良い。",
  "MPR_H_Label" : "コンポーネントに対する管理者権限相当を有する必要がある。",

  "MUI_Heading" : "脆弱性のあるコンポーネントを攻撃する際に必要なユーザ関与レベルを再評価します。",
  "MUI_X_Label" : "この項目を評価しない。",
  "MUI_N_Label" : "ユーザが何もしなくても脆弱性が攻撃される可能性がある。",
  "MUI_R_Label" : "リンクのクリック、ファイル閲覧、設定の変更など、ユーザ動作が必要である。",

  "MS_Heading" : "脆弱性のあるコンポーネントへの攻撃による影響範囲を再評価します。",
  "MS_X_Label" : "この項目を評価しない。",
  "MS_U_Label" : "影響範囲が脆弱性のあるコンポーネントの帰属するオーソリゼーションスコープに留まる。",
  "MS_C_Label" : "影響範囲が脆弱性のあるコンポーネントの帰属するオーソリゼーションスコープ以外にも広がる可能性がある。",

  "MC_Heading" : "脆弱性を攻撃された際に、対象とする影響想定範囲の情報が漏えいする可能性を再評価します。",
  "MC_X_Label" : "この項目を評価しない。",
  "MC_N_Label" : "機密性への影響はない",
  "MC_L_Label" : "情報漏えいやアクセス制限の回避などが発生はするが、その問題による影響が限定的である。",
  "MC_H_Label" : "機密情報や重要なシステムファイルが参照可能であり、その問題による影響が全体に及ぶ。",

  "MI_Heading" : "脆弱性を攻撃された際に、対象とする影響想定範囲の情報が改ざんされる可能性を再評価します。",
  "MI_X_Label" : "この項目を評価しない。",
  "MI_N_Label" : "完全性への影響はない",
  "MI_L_Label" : "情報の改ざんが可能ではあるが、機密情報や重要なシステムファイルの改ざんはできないために、その問題による影響が限定的である。",
  "MI_H_Label" : "機密情報や重要なシステムファイルの改ざんが可能で、その問題による影響が全体に及ぶ。",

  "MA_Heading" : "脆弱性を攻撃された際に、対象とする影響想定範囲の業務が遅延・停止する可能性を再評価します。",
  "MA_X_Label" : "この項目を評価しない。",
  "MA_N_Label" : "可用性への影響はない",
  "MA_L_Label" : "リソースを一時的に枯渇させたり、業務の遅延や一時中断が可能である。",
  "MA_H_Label" : "リソース(ネットワーク帯域、プロセッサ処理、ディスクスペースなど)を完全に枯渇させたり、完全に停止させることが可能である。"

};
